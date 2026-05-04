"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEmergencyStatus = exports.getIncidentHistory = exports.getEmergencyById = exports.getActiveEmergencies = exports.createSosAlert = exports.assignResponder = void 0;
const env_config_1 = require("../config/env.config");
const constants_1 = require("../constants");
const models_1 = require("../db/models");
const notification_service_1 = require("../services/notification.service");
const ApiError_1 = __importDefault(require("../utils/api/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/api/ApiResponse"));
const asyncHandler_1 = require("../utils/api/asyncHandler");
const distance_1 = require("../utils/distance");
const zod_1 = require("zod");
const emergencyTypeSchema = zod_1.z.enum(["medical", "fire", "police"]);
const emergencyStatusSchema = zod_1.z.enum(["pending", "accepted", "resolved"]);
const sosSchema = zod_1.z.object({
    coordinates: zod_1.z.object({
        latitude: zod_1.z.coerce.string(),
        longitude: zod_1.z.coerce.string(),
    }),
    emergencyType: emergencyTypeSchema,
    timestamp: zod_1.z.coerce.date().optional(),
    description: zod_1.z.string().max(500).optional(),
});
const statusSchema = zod_1.z.object({
    status: emergencyStatusSchema,
});
const assignResponderSchema = zod_1.z.object({
    serviceProviderId: zod_1.z.string().min(1),
});
function mapEmergencyTypeToServiceType(type) {
    switch (type) {
        case "medical":
            return "ambulance";
        case "fire":
            return "fire_truck";
        case "police":
            return "police";
    }
}
function mapDbStatusToApiStatus(status) {
    if (status === "assigned" || status === "in_progress")
        return "accepted";
    if (status === "completed")
        return "resolved";
    return "pending";
}
function mapApiStatusToDbStatus(status) {
    if (status === "accepted")
        return "assigned";
    if (status === "resolved")
        return "completed";
    return "pending";
}
function serializeEmergency(request, response) {
    return {
        id: request.id,
        userId: request.userId,
        emergencyType: request.serviceType === "ambulance"
            ? "medical"
            : request.serviceType === "fire_truck"
                ? "fire"
                : request.serviceType,
        coordinates: request.location,
        timestamp: request.requestTime,
        description: request.description || "",
        status: mapDbStatusToApiStatus(request.requestStatus),
        responder: response
            ? {
                serviceProviderId: response.serviceProviderId,
                status: response.statusUpdate,
                assignedAt: response.assignedAt,
                respondedAt: response.respondedAt,
            }
            : null,
    };
}
async function buildIncidentLog(request) {
    const [response, requester] = (await Promise.all([
        models_1.EmergencyResponseModel.findOne({ emergencyRequestId: request.id }).lean(),
        models_1.UserModel.findOne({ id: request.userId }).lean(),
    ]));
    return {
        emergencyId: request.id,
        user: requester
            ? {
                id: requester.id,
                name: requester.name,
                phoneNumber: String(requester.phoneNumber),
                email: requester.email,
            }
            : null,
        location: request.location,
        responseStatus: mapDbStatusToApiStatus(request.requestStatus),
        timestamps: {
            requestedAt: request.requestTime,
            dispatchedAt: request.dispatchTime || null,
            arrivedAt: request.arrivalTime || null,
            lastUpdatedAt: request.updatedAt,
        },
        responder: response
            ? {
                serviceProviderId: response.serviceProviderId,
                status: response.statusUpdate,
                assignedAt: response.assignedAt,
                respondedAt: response.respondedAt,
            }
            : null,
    };
}
async function findNearbyResponders(coordinates, serviceType) {
    const responders = (await models_1.ServiceProviderModel.find({
        serviceType,
        serviceStatus: "available",
    }).lean());
    return responders
        .filter((responder) => responder.currentLocation?.latitude && responder.currentLocation?.longitude)
        .map((responder) => ({
        ...responder,
        distanceKm: (0, distance_1.calculateDistance)(coordinates, responder.currentLocation),
    }))
        .filter((responder) => responder.distanceKm <= env_config_1.envConfig.default_alert_radius_km)
        .sort((left, right) => left.distanceKm - right.distanceKm);
}
/**
 * Creates the main one-tap SOS alert, stores it, and fan-outs notifications.
 */
const createSosAlert = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    if (!userId) {
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const payload = sosSchema.parse(req.body);
    const user = (await models_1.UserModel.findOne({ id: userId }));
    if (!user) {
        throw new ApiError_1.default(404, "User not found");
    }
    user.currentLocation = payload.coordinates;
    await user.save();
    const emergency = (await models_1.EmergencyRequestModel.create({
        userId,
        serviceType: mapEmergencyTypeToServiceType(payload.emergencyType),
        requestStatus: "pending",
        requestTime: payload.timestamp || new Date(),
        description: payload.description || "",
        location: payload.coordinates,
    }));
    const nearbyResponders = await findNearbyResponders(payload.coordinates, emergency.serviceType);
    await (0, notification_service_1.notifyEmergencyNetwork)(userId, {
        emergencyId: emergency.id,
        emergencyType: payload.emergencyType,
        requesterName: user.name,
        location: payload.coordinates,
    }, nearbyResponders.map((responder) => responder.id));
    req.app.get("io").emit(constants_1.SocketEventEnums.SEND_SOS, {
        emergencyId: emergency.id,
        userId,
        emergencyType: payload.emergencyType,
        coordinates: payload.coordinates,
        timestamp: emergency.requestTime,
    });
    req.app.get("io").to(constants_1.SocketRoom.USER(userId)).emit(constants_1.SocketEventEnums.RECEIVE_ALERT, {
        emergencyId: emergency.id,
        status: "pending",
    });
    for (const responder of nearbyResponders) {
        req.app
            .get("io")
            .to(constants_1.SocketRoom.PROVIDER(responder.id))
            .emit(constants_1.SocketEventEnums.RECEIVE_ALERT, {
            emergencyId: emergency.id,
            emergencyType: payload.emergencyType,
            coordinates: payload.coordinates,
        });
    }
    const incidentLog = await buildIncidentLog(emergency.toObject());
    return res.status(201).json(new ApiResponse_1.default(201, "SOS alert created successfully", {
        alert: serializeEmergency(emergency.toObject()),
        nearbyResponders: nearbyResponders.map((responder) => ({
            id: responder.id,
            name: responder.name,
            serviceType: responder.serviceType,
            distanceKm: Number(responder.distanceKm.toFixed(2)),
        })),
        incidentLog,
    }));
});
exports.createSosAlert = createSosAlert;
/**
 * Returns a single emergency by id, with responder context when available.
 */
const getEmergencyById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const emergency = (await models_1.EmergencyRequestModel.findOne({ id }).lean());
    if (!emergency) {
        throw new ApiError_1.default(404, "Emergency not found");
    }
    if (req.user.role !== "admin" && req.user.id !== emergency.userId) {
        throw new ApiError_1.default(403, "Not authorized to view this emergency");
    }
    const responseEntry = (await models_1.EmergencyResponseModel.findOne({
        emergencyRequestId: emergency.id,
    }).lean());
    return res
        .status(200)
        .json(new ApiResponse_1.default(200, "Emergency retrieved", serializeEmergency(emergency, responseEntry)));
});
exports.getEmergencyById = getEmergencyById;
/**
 * Updates an emergency status and keeps responder state synchronized.
 */
const updateEmergencyStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const payload = statusSchema.parse(req.body);
    const emergency = (await models_1.EmergencyRequestModel.findOne({ id }));
    if (!emergency) {
        throw new ApiError_1.default(404, "Emergency not found");
    }
    if (req.user.role !== "admin" && req.user.id !== emergency.userId) {
        throw new ApiError_1.default(403, "Not authorized to update this emergency");
    }
    emergency.requestStatus = mapApiStatusToDbStatus(payload.status);
    if (payload.status === "accepted" && !emergency.dispatchTime) {
        emergency.dispatchTime = new Date();
    }
    if (payload.status === "resolved") {
        emergency.arrivalTime = new Date();
    }
    await emergency.save();
    const responseEntry = (await models_1.EmergencyResponseModel.findOne({
        emergencyRequestId: emergency.id,
    }));
    if (payload.status === "resolved" && responseEntry) {
        await models_1.ServiceProviderModel.updateOne({ id: responseEntry.serviceProviderId }, { serviceStatus: "available" });
        responseEntry.statusUpdate = "arrived";
        await responseEntry.save();
    }
    req.app.get("io").to(constants_1.SocketRoom.USER(emergency.userId)).emit(constants_1.SocketEventEnums.RECEIVE_ALERT, {
        emergencyId: emergency.id,
        status: payload.status,
    });
    const serialized = serializeEmergency(emergency.toObject(), responseEntry?.toObject?.() || responseEntry || undefined);
    return res
        .status(200)
        .json(new ApiResponse_1.default(200, "Emergency status updated", serialized));
});
exports.updateEmergencyStatus = updateEmergencyStatus;
/**
 * Lists the authenticated user's incident log history.
 */
const getIncidentHistory = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const filter = req.user.role === "admin" ? {} : { userId: req.user.id };
    const emergencies = (await models_1.EmergencyRequestModel.find(filter)
        .sort({ requestTime: -1 })
        .lean());
    const logs = await Promise.all(emergencies.map((emergency) => buildIncidentLog(emergency)));
    return res
        .status(200)
        .json(new ApiResponse_1.default(200, "Incident history retrieved", logs));
});
exports.getIncidentHistory = getIncidentHistory;
/**
 * Returns all active emergencies for admin operations.
 */
const getActiveEmergencies = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const activeEmergencies = (await models_1.EmergencyRequestModel.find({
        requestStatus: { $nin: ["completed", "rejected"] },
    })
        .sort({ requestTime: -1 })
        .lean());
    const payload = await Promise.all(activeEmergencies.map(async (emergency) => {
        const responseEntry = (await models_1.EmergencyResponseModel.findOne({
            emergencyRequestId: emergency.id,
        }).lean());
        return serializeEmergency(emergency, responseEntry || undefined);
    }));
    return res
        .status(200)
        .json(new ApiResponse_1.default(200, "Active emergencies retrieved", payload));
});
exports.getActiveEmergencies = getActiveEmergencies;
/**
 * Assigns a responder to an emergency and updates both alert and responder state.
 */
const assignResponder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const payload = assignResponderSchema.parse(req.body);
    const [emergency, responder] = (await Promise.all([
        models_1.EmergencyRequestModel.findOne({ id }),
        models_1.ServiceProviderModel.findOne({ id: payload.serviceProviderId }),
    ]));
    if (!emergency) {
        throw new ApiError_1.default(404, "Emergency not found");
    }
    if (!responder) {
        throw new ApiError_1.default(404, "Responder not found");
    }
    emergency.requestStatus = "assigned";
    emergency.dispatchTime = new Date();
    await emergency.save();
    responder.serviceStatus = "assigned";
    await responder.save();
    const responseEntry = (await models_1.EmergencyResponseModel.findOneAndUpdate({ emergencyRequestId: emergency.id }, {
        emergencyRequestId: emergency.id,
        serviceProviderId: responder.id,
        statusUpdate: "accepted",
        originLocation: responder.currentLocation || {
            latitude: "",
            longitude: "",
        },
        destinationLocation: emergency.location,
        assignedAt: new Date(),
        respondedAt: new Date(),
        updateDescription: "Responder assigned by admin",
    }, { new: true, upsert: true }).lean());
    req.app.get("io").to(constants_1.SocketRoom.PROVIDER(responder.id)).emit(constants_1.SocketEventEnums.RECEIVE_ALERT, {
        emergencyId: emergency.id,
        status: "accepted",
        assignedResponder: responder.id,
    });
    req.app.get("io").to(constants_1.SocketRoom.USER(emergency.userId)).emit(constants_1.SocketEventEnums.RECEIVE_ALERT, {
        emergencyId: emergency.id,
        status: "accepted",
        assignedResponder: responder.id,
    });
    return res.status(200).json(new ApiResponse_1.default(200, "Responder assigned successfully", {
        emergency: serializeEmergency(emergency.toObject(), responseEntry || undefined),
        responder: {
            id: responder.id,
            name: responder.name,
            serviceType: responder.serviceType,
            phoneNumber: String(responder.phoneNumber),
        },
    }));
});
exports.assignResponder = assignResponder;
