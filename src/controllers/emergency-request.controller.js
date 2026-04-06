"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentEmergencyRequests = exports.deleteEmergencyRequest = exports.updateEmergencyRequest = exports.getUsersEmergencyRequests = exports.getEmergencyRequest = exports.createEmergencyRequest = void 0;
const asyncHandler_1 = require("../utils/api/asyncHandler");
const db_1 = __importDefault(require("../db"));
const ApiError_1 = __importDefault(require("../utils/api/ApiError"));
const query_1 = require("../db/query");
const schema_1 = require("../db/schema");
const ApiResponse_1 = __importDefault(require("../utils/api/ApiResponse"));
const createEmergencyRequest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { emergencyType, emergencyDescription, userLocation } = req.body;
    const loggedInUser = req.user;
    if (!loggedInUser.id) {
        console.log("User ID is required");
        throw new ApiError_1.default(400, "User ID is required");
    }
    if (!userLocation) {
        console.log("user location required");
        throw new ApiError_1.default(400, "user location required");
    }
    if (!userLocation.latitude || !userLocation.longitude) {
        console.log("Emergency location coordinates are required");
        throw new ApiError_1.default(400, "Emergency location coordinates are required");
    }
    if (isNaN(parseFloat(userLocation.latitude)) ||
        isNaN(parseFloat(userLocation.longitude))) {
        console.log("Invalid emergency location coordinates");
        throw new ApiError_1.default(400, "Invalid emergency location coordinates");
    }
    const updateUserLocation = await db_1.default
        .update(schema_1.user)
        .set({
        currentLocation: userLocation,
    })
        .where((0, query_1.eq)(schema_1.user.id, loggedInUser.id));
    const parsedValues = schema_1.newEmergencyRequestSchema.safeParse({
        userId: loggedInUser.id,
        serviceType: String(emergencyType).toLowerCase(),
        description: emergencyDescription,
        location: userLocation,
    });
    if (!parsedValues.success) {
        console.log("Parsing Error: ", parsedValues.error.errors);
        throw new ApiError_1.default(400, parsedValues.error.errors.join(","));
    }
    const newEmergencyRequest = await db_1.default
        .insert(schema_1.emergencyRequest)
        .values(parsedValues.data)
        .returning({
        id: schema_1.emergencyRequest.id,
        userId: schema_1.emergencyRequest.userId,
        emergencyType: schema_1.emergencyRequest.serviceType,
        emergencyDescription: schema_1.emergencyRequest.description,
        emergencyLocation: schema_1.emergencyRequest.location,
        status: schema_1.emergencyRequest.requestStatus,
        currentLocation: schema_1.emergencyRequest.location,
    });
    if (!newEmergencyRequest) {
        console.log("Error creating emergency request");
        throw new ApiError_1.default(500, "Error creating emergency request");
    }
    res.status(201).json(new ApiResponse_1.default(201, "Emergency request created", {
        emergencyRequest: newEmergencyRequest[0],
    }));
});
exports.createEmergencyRequest = createEmergencyRequest;
const getEmergencyRequest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const emergencyRequestData = await db_1.default.query.emergencyRequest.findFirst({
        where: (0, query_1.and)((0, query_1.eq)(schema_1.emergencyRequest.id, id)),
    });
    return res
        .status(200)
        .json(new ApiResponse_1.default(200, "Emergency request found", emergencyRequestData));
});
exports.getEmergencyRequest = getEmergencyRequest;
const getUsersEmergencyRequests = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const loggedInUser = req.user;
    if (!loggedInUser || !loggedInUser.id) {
        console.log("User ID is required");
        throw new ApiError_1.default(400, "User ID is required");
    }
    const emergencyRequests = await db_1.default.query.emergencyRequest.findMany({
        where: (0, query_1.eq)(schema_1.emergencyRequest.userId, loggedInUser.id),
    });
    return res
        .status(200)
        .json(new ApiResponse_1.default(200, "Emergency requests found", emergencyRequests));
});
exports.getUsersEmergencyRequests = getUsersEmergencyRequests;
const updateEmergencyRequest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!id) {
        console.log("Emergency request ID is required");
        throw new ApiError_1.default(400, "Emergency request ID is required");
    }
    const updateData = req.body;
    if (Object.keys(updateData).length === 0) {
        console.log("No data to update");
        throw new ApiError_1.default(400, "No data to update");
    }
    const invalidKeys = Object.keys(updateData).filter((key) => !Object.keys(schema_1.emergencyRequest).includes(key));
    if (invalidKeys.length > 0) {
        console.log(`Invalid data to update. Invalid keys: ${invalidKeys}`);
        throw new ApiError_1.default(400, `Invalid data to update. Invalid keys: ${invalidKeys}`);
    }
    const existingEmergencyRequest = await db_1.default.query.emergencyRequest.findFirst({
        where: (0, query_1.eq)(schema_1.emergencyRequest.id, id),
    });
    if (!existingEmergencyRequest) {
        console.log("Emergency request not found");
        throw new ApiError_1.default(404, "Emergency request not found");
    }
    const updatedEmergencyRequest = await db_1.default
        .update(schema_1.emergencyRequest)
        .set(updateData)
        .where((0, query_1.eq)(schema_1.emergencyRequest.id, id))
        .returning({
        id: schema_1.emergencyRequest.id,
        userId: schema_1.emergencyRequest.userId,
        emergencyType: schema_1.emergencyRequest.serviceType,
        emergencyDescription: schema_1.emergencyRequest.description,
        emergencyLocation: schema_1.emergencyRequest.location,
        requestStatus: schema_1.emergencyRequest.requestStatus,
    });
    if (!updatedEmergencyRequest) {
        console.log("Error updating emergency request");
        throw new ApiError_1.default(500, "Error updating emergency request");
    }
    res
        .status(200)
        .json(new ApiResponse_1.default(200, "Emergency request updated", updatedEmergencyRequest));
});
exports.updateEmergencyRequest = updateEmergencyRequest;
const deleteEmergencyRequest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const loggedInUser = req.user;
    if (!loggedInUser || !loggedInUser.id) {
        console.log("User ID is required");
        throw new ApiError_1.default(400, "User ID is required");
    }
    if (!loggedInUser.role) {
        console.log("User role is required");
        throw new ApiError_1.default(400, "User role is required");
    }
    if (!id) {
        console.log("Emergency request ID is required");
        throw new ApiError_1.default(400, "Emergency request ID is required");
    }
    const existingEmergencyRequest = await db_1.default.query.emergencyRequest.findFirst({
        where: (0, query_1.eq)(schema_1.emergencyRequest.id, id),
    });
    if (!existingEmergencyRequest) {
        console.log("Emergency request not found");
        throw new ApiError_1.default(404, "Emergency request not found");
    }
    const deletedEmergencyRequest = await db_1.default
        .delete(schema_1.emergencyRequest)
        .where((0, query_1.eq)(schema_1.emergencyRequest.id, id))
        .returning({
        id: schema_1.emergencyRequest.id,
        patientId: schema_1.emergencyRequest.userId,
        emergencyType: schema_1.emergencyRequest.serviceType,
        emergencyDescription: schema_1.emergencyRequest.description,
        emergencyLocation: schema_1.emergencyRequest.location,
        status: schema_1.emergencyRequest.requestStatus,
    });
    if (!deletedEmergencyRequest) {
        console.log("Error deleting emergency request");
        throw new ApiError_1.default(500, "Error deleting emergency request");
    }
    res
        .status(200)
        .json(new ApiResponse_1.default(200, "Emergency request deleted", deletedEmergencyRequest));
});
exports.deleteEmergencyRequest = deleteEmergencyRequest;
const getRecentEmergencyRequests = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    console.log("userId", userId);
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
    const recentRequests = await db_1.default.query.emergencyRequest.findMany({
        where: (0, query_1.eq)(schema_1.emergencyRequest.userId, userId),
        orderBy: [(0, query_1.desc)(schema_1.emergencyRequest.requestTime)],
        limit: 10,
    });
    return res
        .status(200)
        .json(new ApiResponse_1.default(200, "Recent emergency requests", recentRequests));
});
exports.getRecentEmergencyRequests = getRecentEmergencyRequests;
