"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersFeedback = exports.getFeedback = exports.deleteFeedback = exports.updateFeedback = exports.createFeedback = void 0;
const db_1 = __importDefault(require("../db"));
const schema_1 = require("../db/schema");
const ApiError_1 = __importDefault(require("../utils/api/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/api/ApiResponse"));
const asyncHandler_1 = require("../utils/api/asyncHandler");
const query_1 = require("../db/query");
const createFeedback = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { serviceProviderId, message, serviceRatings } = req.body;
    const { id } = req.user;
    if (!id) {
        throw new ApiError_1.default(401, "Unauthorized to perform this action");
    }
    if (!serviceProviderId || !message || !serviceRatings) {
        throw new ApiError_1.default(400, "Missing required fields");
    }
    const createdFeedback = await db_1.default
        .insert(schema_1.feedback)
        .values({
        userId: id,
        serviceProviderId,
        message,
        serviceRatings,
    })
        .returning({
        id: schema_1.feedback.id,
        userId: schema_1.feedback.userId,
        serviceProviderId: schema_1.feedback.serviceProviderId,
        message: schema_1.feedback.message,
        serviceRatings: schema_1.feedback.serviceRatings,
        createdAt: schema_1.feedback.createdAt,
        updatedAt: schema_1.feedback.updatedAt,
    });
    if (!createdFeedback || createdFeedback.length === 0) {
        throw new ApiError_1.default(500, "Failed to create feedback");
    }
    res.status(201).json(new ApiResponse_1.default(201, "Feedback created", {
        feedback: createdFeedback[0],
    }));
});
exports.createFeedback = createFeedback;
const updateFeedback = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { id: userId } = req.user;
    if (!userId) {
        throw new ApiError_1.default(401, "Unauthorized to perform this action");
    }
    const existingFeedback = await db_1.default.query.feedback.findFirst({
        where: (0, query_1.eq)(schema_1.feedback.id, id),
    });
    if (!existingFeedback) {
        throw new ApiError_1.default(404, "Feedback not found");
    }
    if (existingFeedback?.userId !== userId) {
        throw new ApiError_1.default(401, "Unauthorized to perform this action");
    }
    const updateData = req.body;
    if (Object.keys(updateData).length === 0) {
        throw new ApiError_1.default(400, "No data to update");
    }
    const invalidKeys = Object.keys(updateData).filter((key) => !Object.keys(schema_1.feedback).includes(key));
    if (invalidKeys.length > 0) {
        throw new ApiError_1.default(400, `Invalid data to update. Invalid keys: ${invalidKeys}`);
    }
    const updatedFeedback = await db_1.default
        .update(schema_1.feedback)
        .set(updateData)
        .where((0, query_1.eq)(schema_1.feedback.id, id))
        .returning();
    if (!updatedFeedback) {
        throw new ApiError_1.default(500, "Failed to update feedback");
    }
    res.status(200).json(new ApiResponse_1.default(200, "Feedback updated", {
        feedback: updatedFeedback[0],
    }));
});
exports.updateFeedback = updateFeedback;
const deleteFeedback = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { id: userId, role } = req.user;
    if (!userId) {
        throw new ApiError_1.default(401, "Unauthorized to perform this action");
    }
    const existingFeedback = await db_1.default.query.feedback.findFirst({
        where: (0, query_1.eq)(schema_1.feedback.id, id),
    });
    if (!existingFeedback) {
        throw new ApiError_1.default(404, "Feedback not found");
    }
    if (role !== "admin" && existingFeedback?.userId !== userId) {
        throw new ApiError_1.default(401, "Unauthorized to perform this action");
    }
    const deletedFeedback = await db_1.default
        .delete(schema_1.feedback)
        .where((0, query_1.eq)(schema_1.feedback.id, id))
        .returning();
    if (!deletedFeedback) {
        throw new ApiError_1.default(500, "Failed to delete feedback");
    }
    res.status(200).json(new ApiResponse_1.default(200, "Feedback deleted", {
        feedback: deletedFeedback[0],
    }));
});
exports.deleteFeedback = deleteFeedback;
const getFeedback = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const existingFeedback = await db_1.default.query.feedback.findFirst({
        where: (0, query_1.eq)(schema_1.feedback.id, id),
    });
    if (!existingFeedback) {
        throw new ApiError_1.default(404, "Feedback not found");
    }
    res
        .status(200)
        .json(new ApiResponse_1.default(200, "Feedback found", existingFeedback));
});
exports.getFeedback = getFeedback;
const getUsersFeedback = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const loggedInUser = req.user;
    if (!loggedInUser || !loggedInUser.id) {
        throw new ApiError_1.default(401, "Unauthorized to perform this action");
    }
    const feedbacks = await db_1.default.query.feedback.findMany({
        where: (0, query_1.eq)(schema_1.feedback.userId, loggedInUser.id),
    });
    res.status(200).json(new ApiResponse_1.default(200, "Feedbacks found", feedbacks));
});
exports.getUsersFeedback = getUsersFeedback;
