"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProviderResponses = exports.deleteEmergencyResponse = exports.updateEmergencyResponse = exports.getEmergencyResponse = exports.createEmergencyResponse = void 0;
const asyncHandler_1 = require("../utils/api/asyncHandler");
const db_1 = __importDefault(require("../db"));
const ApiError_1 = __importDefault(require("../utils/api/ApiError"));
const query_1 = require("../db/query");
const schema_1 = require("../db/schema");
const ApiResponse_1 = __importDefault(require("../utils/api/ApiResponse"));
const galli_maps_1 = require("../utils/maps/galli-maps");
const socket_1 = require("../socket");
const constants_1 = require("../constants");
const notification_controller_1 = require("./notification.controller");
// Helper function to generate a nearby location
const generateNearbyLocation = (baseLocation) => {
    const latOffset = (Math.random() - 0.5) * 0.03;
    const lngOffset = (Math.random() - 0.5) * 0.02;
    return {
        latitude: (baseLocation.latitude + latOffset).toString(),
        longitude: (baseLocation.longitude + lngOffset).toString(),
    };
};
const createEmergencyResponse = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const loggedInUser = req.user;
    if (!loggedInUser || !loggedInUser.id) {
        throw new ApiError_1.default(400, "Please login to perform this action");
    }
    let { emergencyRequestId, destLocation } = req.body;
    if (!emergencyRequestId) {
        throw new ApiError_1.default(400, "Emergency ID are required");
    }
    const existingEmergencyResponse = await db_1.default.query.emergencyResponse.findFirst({
        where: (0, query_1.and)((0, query_1.eq)(emergencyRequestId, schema_1.emergencyResponse.emergencyRequestId)),
    });
    if (existingEmergencyResponse) {
        throw new ApiError_1.default(400, "Emergency response already exists");
    }
    if (!destLocation) {
        destLocation = loggedInUser.currentLocation;
    }
    const emergencyRequestDetails = await db_1.default.query.emergencyRequest.findFirst({
        where: (0, query_1.eq)(schema_1.emergencyRequest.id, emergencyRequestId),
    });
    if (isNaN(parseFloat(destLocation.latitude)) ||
        isNaN(parseFloat(destLocation.longitude))) {
        throw new ApiError_1.default(400, "Invalid emergency location coordinates");
    }
    const emergencyRequestType = emergencyRequestDetails?.serviceType;
    if (!emergencyRequestType) {
        throw new ApiError_1.default(400, "Emergency request type not found");
    }
    // ! Simulating the nearby Location
    const simulatedProviderLocation = generateNearbyLocation(destLocation);
    const selectedServiceProvider = await db_1.default
        .update(schema_1.serviceProvider)
        .set({
        currentLocation: simulatedProviderLocation,
    })
        .where((0, query_1.and)((0, query_1.eq)(schema_1.serviceProvider.serviceStatus, "available"), (0, query_1.eq)(schema_1.serviceProvider.serviceType, emergencyRequestType)))
        .returning();
    // console.log(selectedServiceProvider, "selected provider");
    // const bestServiceProvider = await getBestServiceProvider(
    //   emergencyRequestLocation,
    //   emergencyRequestType
    // );
    // if (!bestServiceProvider || !bestServiceProvider.id) {
    //   await db
    //     .delete(emergencyRequest)
    //     .where(eq(emergencyRequest.id, emergencyRequestId));
    //   throw new ApiError(404, "No available service provider found");
    // }
    // const serviceProviderId = bestServiceProvider.id;
    // if(selectedServiceProvider.length === 0) {
    //   await db
    //     .delete(emergencyRequest)
    //     .where(eq(emergencyRequest.id, emergencyRequestId));
    //   throw new ApiError(404, "No available service provider found");
    // }
    const serviceProviderId = selectedServiceProvider[0].id;
    const assignedServiceProvider = await db_1.default.query.serviceProvider.findFirst({
        where: (0, query_1.eq)(schema_1.serviceProvider.id, serviceProviderId),
    });
    if (!assignedServiceProvider || !emergencyRequestDetails) {
        throw new ApiError_1.default(404, "Service provider or emergency request not found");
    }
    if (!assignedServiceProvider.currentLocation) {
        throw new ApiError_1.default(400, "Service provider location not found");
    }
    const optimalPath = await (0, galli_maps_1.getOptimalRoute)({
        srcLat: assignedServiceProvider.currentLocation?.latitude,
        srcLng: assignedServiceProvider.currentLocation?.longitude,
        dstLat: destLocation?.latitude.toString(),
        dstLng: destLocation?.longitude.toString(),
    });
    if (!optimalPath) {
        throw new ApiError_1.default(400, "Error getting optimal path");
    }
    const newEmergencyResponse = await db_1.default
        .insert(schema_1.emergencyResponse)
        .values({
        emergencyRequestId,
        serviceProviderId,
        assignedAt: new Date(emergencyRequestDetails.createdAt),
        originLocation: assignedServiceProvider.currentLocation,
        destinationLocation: {
            latitude: destLocation.latitude.toString(),
            longitude: destLocation.longitude.toString(),
        },
    })
        .returning();
    if (!newEmergencyResponse) {
        throw new ApiError_1.default(500, "Error creating emergency response");
    }
    const updatedStatus = Promise.all([
        db_1.default
            .update(schema_1.emergencyRequest)
            .set({
            requestStatus: "assigned",
        })
            .where((0, query_1.eq)(schema_1.emergencyRequest.id, emergencyRequestId)),
        db_1.default
            .update(schema_1.serviceProvider)
            .set({
            serviceStatus: "assigned",
        })
            .where((0, query_1.eq)(schema_1.serviceProvider.id, serviceProviderId)),
    ]);
    const locationName = await (0, galli_maps_1.reverseGeoCode)(emergencyRequestDetails.location.longitude, emergencyRequestDetails.location.latitude);
    const providerNotification = await (0, notification_controller_1.createNotification)({
        serviceProviderId: assignedServiceProvider.id,
        userId: loggedInUser.id,
        message: `New emergency request assigned to you. Type: ${emergencyRequestType}`,
        type: "emergency",
        priority: "high",
        deliveryStatus: "unread",
        source: "system",
        metadata: {
            emergencyType: emergencyRequestType,
            location: locationName,
            distance: optimalPath?.distance || "Calculating...",
            userInfo: {
                name: loggedInUser.name,
                contact: loggedInUser.phoneNumber,
            },
        },
    });
    (0, socket_1.emitSocketEvent)(req, constants_1.SocketRoom.PROVIDER(assignedServiceProvider.id), constants_1.SocketEventEnums.PROVIDER_STATUS_UPDATED, {
        status: assignedServiceProvider.serviceStatus,
    });
    // Create notification for the user
    (0, socket_1.emitSocketEvent)(req, constants_1.SocketRoom.PROVIDER(assignedServiceProvider.id), constants_1.SocketEventEnums.NOTIFICATION_CREATED, providerNotification);
    (0, socket_1.emitSocketEvent)(req, constants_1.SocketRoom.USER(loggedInUser.id), constants_1.SocketEventEnums.EMERGENCY_RESPONSE_CREATED, {
        emergencyResponse: newEmergencyResponse[0],
        optimalPath,
    });
    (0, socket_1.emitSocketEvent)(req, constants_1.SocketRoom.PROVIDER(assignedServiceProvider.id), constants_1.SocketEventEnums.EMERGENCY_RESPONSE_CREATED, {
        emergencyResponse: newEmergencyResponse[0],
        optimalPath,
    });
    if (!updatedStatus) {
        await db_1.default
            .delete(schema_1.emergencyResponse)
            .where((0, query_1.eq)(schema_1.emergencyResponse.id, newEmergencyResponse[0].id));
        console.log("Error updating emergency request and service provider status");
        throw new ApiError_1.default(500, "Error updating emergency request and service provider status");
    }
    console.log("Optimal path", optimalPath);
    console.log("New emergency response", newEmergencyResponse);
    res.status(201).json(new ApiResponse_1.default(201, "Emergency response created", {
        emergencyResponse: newEmergencyResponse,
        optimalPath,
    }));
});
exports.createEmergencyResponse = createEmergencyResponse;
const getEmergencyResponse = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        console.log("Emergency response ID is required");
        throw new ApiError_1.default(400, "Emergency response ID is required");
    }
    const existingEmergencyResponse = await db_1.default.query.emergencyResponse.findFirst({
        where: (0, query_1.eq)(schema_1.emergencyResponse.id, id),
    });
    if (!existingEmergencyResponse) {
        console.log("Emergency response not found");
        throw new ApiError_1.default(404, "Emergency response not found");
    }
    res
        .status(200)
        .json(new ApiResponse_1.default(200, "Emergency response found", schema_1.emergencyResponse));
});
exports.getEmergencyResponse = getEmergencyResponse;
const updateEmergencyResponse = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { statusUpdate, updateDescription } = req.body;
    if (!id) {
        console.log("Emergency response ID is required");
        throw new ApiError_1.default(400, "Emergency response ID is required");
    }
    const existingEmergencyResponse = await db_1.default.query.emergencyResponse.findFirst({
        where: (0, query_1.eq)(schema_1.emergencyResponse.id, id),
    });
    if (!existingEmergencyResponse) {
        console.log("Emergency response not found");
        throw new ApiError_1.default(404, "Emergency response not found");
    }
    const updatedEmergencyResponse = await db_1.default.transaction(async (tx) => {
        // Update emergency response
        const updatedResponse = await tx
            .update(schema_1.emergencyResponse)
            .set({
            statusUpdate,
            updateDescription,
        })
            .where((0, query_1.eq)(schema_1.emergencyResponse.id, id))
            .returning({
            id: schema_1.emergencyResponse.id,
            emergencyRequestId: schema_1.emergencyResponse.emergencyRequestId,
            serviceProviderId: schema_1.emergencyResponse.serviceProviderId,
            assignedAt: schema_1.emergencyResponse.assignedAt,
            respondedAt: schema_1.emergencyResponse.respondedAt,
            statusUpdate: schema_1.emergencyResponse.statusUpdate,
            updateDescription: schema_1.emergencyResponse.updateDescription,
        });
        if (!updatedResponse || updatedResponse.length === 0) {
            throw new ApiError_1.default(500, "Error updating emergency response");
        }
        let requestStatus;
        switch (statusUpdate) {
            case "arrived":
                requestStatus = "in_progress";
                break;
            case "rejected":
                requestStatus = "pending"; // Set back to pending so it can be reassigned
                break;
            case "completed":
                requestStatus = "completed";
                break;
            default:
                requestStatus = "assigned";
        }
        // Update emergency request status
        const updatedRequest = await tx
            .update(schema_1.emergencyRequest)
            .set({
            requestStatus,
        })
            .where((0, query_1.eq)(schema_1.emergencyRequest.id, existingEmergencyResponse.emergencyRequestId))
            .returning();
        if (!updatedRequest || updatedRequest.length === 0) {
            throw new ApiError_1.default(500, "Error updating emergency request");
        }
        return updatedResponse[0];
    });
    if (!updatedEmergencyResponse) {
        console.log("Error updating emergency response");
        throw new ApiError_1.default(500, "Error updating emergency response");
    }
    // Get the emergency request to get the user ID
    const emergencyRequestDetails = await db_1.default.query.emergencyRequest.findFirst({
        where: (0, query_1.eq)(schema_1.emergencyRequest.id, existingEmergencyResponse.emergencyRequestId),
    });
    if (!emergencyRequestDetails) {
        console.log("Emergency request not found");
        throw new ApiError_1.default(404, "Emergency request not found");
    }
    // Emit socket events to both user and provider
    (0, socket_1.emitSocketEvent)(req, constants_1.SocketRoom.USER(emergencyRequestDetails.userId), constants_1.SocketEventEnums.EMERGENCY_RESPONSE_STATUS_UPDATED, {
        statusUpdate,
        message: statusUpdate === "arrived"
            ? "Service provider has arrived at your location"
            : "Service provider has rejected the emergency response",
    });
    (0, socket_1.emitSocketEvent)(req, constants_1.SocketRoom.PROVIDER(existingEmergencyResponse.serviceProviderId), constants_1.SocketEventEnums.EMERGENCY_RESPONSE_STATUS_UPDATED, {
        statusUpdate,
        message: statusUpdate === "arrived"
            ? "You have marked yourself as arrived"
            : "You have rejected the emergency response",
    });
    res
        .status(200)
        .json(new ApiResponse_1.default(200, "Emergency response updated", updatedEmergencyResponse));
});
exports.updateEmergencyResponse = updateEmergencyResponse;
const deleteEmergencyResponse = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        console.log("Emergency response ID is required");
        throw new ApiError_1.default(400, "Emergency response ID is required");
    }
    const existingEmergencyResponse = await db_1.default.query.emergencyResponse.findFirst({
        where: (0, query_1.eq)(schema_1.emergencyResponse.id, id),
    });
    if (!existingEmergencyResponse) {
        console.log("Emergency response not found");
        throw new ApiError_1.default(404, "Emergency response not found");
    }
    const deletedEmergencyResponse = await db_1.default
        .delete(schema_1.emergencyResponse)
        .where((0, query_1.eq)(schema_1.emergencyResponse.id, id))
        .returning({
        id: schema_1.emergencyResponse.id,
        emergencyRequestId: schema_1.emergencyResponse.emergencyRequestId,
        serviceProviderId: schema_1.emergencyResponse.serviceProviderId,
        assignedAt: schema_1.emergencyResponse.assignedAt,
        respondedAt: schema_1.emergencyResponse.respondedAt,
        statusUpdate: schema_1.emergencyResponse.statusUpdate,
        updateDescription: schema_1.emergencyResponse.updateDescription,
    });
    if (!deletedEmergencyResponse) {
        console.log("Error deleting emergency response");
        throw new ApiError_1.default(500, "Error deleting emergency response");
    }
    res
        .status(200)
        .json(new ApiResponse_1.default(200, "Emergency response deleted", deletedEmergencyResponse));
});
exports.deleteEmergencyResponse = deleteEmergencyResponse;
const getProviderResponses = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const loggedInUser = req.user;
    if (!loggedInUser || !loggedInUser.id) {
        console.log("Unauthorized");
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const existingServiceProvider = await db_1.default.query.serviceProvider.findFirst({
        where: (0, query_1.eq)(schema_1.serviceProvider.id, loggedInUser.id),
        columns: {
            id: true,
            name: true,
            phoneNumber: true,
            email: true,
            age: true,
            primaryAddress: true,
        },
    });
    if (!existingServiceProvider) {
        console.log("Unauthorized Service Provider");
        throw new ApiError_1.default(401, "Unauthorized Service Provider");
    }
    const providerResponses = await db_1.default.query.emergencyResponse.findMany({
        where: (0, query_1.eq)(schema_1.emergencyResponse.serviceProviderId, existingServiceProvider.id),
    });
    console.log("PROVIDER Responses", providerResponses);
    return res
        .status(200)
        .json(new ApiResponse_1.default(200, "Provider responses found", providerResponses));
});
exports.getProviderResponses = getProviderResponses;
