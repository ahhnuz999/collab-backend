"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getUserResponses = exports.getUserRequests = exports.getUserContacts = exports.getProfile = exports.getUserById = exports.getAllUsers = void 0;
const models_1 = require("../db/models");
const ApiError_1 = __importDefault(require("../utils/api/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/api/ApiResponse"));
const asyncHandler_1 = require("../utils/api/asyncHandler");
const zod_1 = require("zod");
const updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    phoneNumber: zod_1.z.string().min(7).optional(),
    email: zod_1.z.string().email().optional(),
    primaryAddress: zod_1.z.string().min(3).optional(),
    pushToken: zod_1.z.string().optional(),
    currentLocation: zod_1.z
        .object({
        latitude: zod_1.z.string(),
        longitude: zod_1.z.string(),
    })
        .optional(),
    medicalInfo: zod_1.z
        .object({
        bloodGroup: zod_1.z.string().optional(),
        allergies: zod_1.z.array(zod_1.z.string()).optional(),
        conditions: zod_1.z.array(zod_1.z.string()).optional(),
        medications: zod_1.z.array(zod_1.z.string()).optional(),
        notes: zod_1.z.string().optional(),
    })
        .optional(),
});
function serializeUserProfile(user, contacts) {
    return {
        id: user.id,
        name: user.name,
        age: user.age,
        email: user.email,
        phoneNumber: String(user.phoneNumber),
        primaryAddress: user.primaryAddress,
        role: user.role,
        medicalInfo: user.medicalInfo || {},
        currentLocation: user.currentLocation || null,
        emergencyContacts: contacts.map((contact) => ({
            id: contact.id,
            name: contact.name,
            relationship: contact.relationship,
            phoneNumber: contact.phoneNumber,
            isCommonContact: contact.isCommanContact,
        })),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
function serializeUserSummary(user) {
    return {
        id: user.id,
        name: user.name,
        age: user.age,
        email: user.email,
        phoneNumber: String(user.phoneNumber),
        primaryAddress: user.primaryAddress,
        role: user.role,
        currentLocation: user.currentLocation || null,
        medicalInfo: user.medicalInfo || {},
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
function canAccessUserResource(req, targetUserId) {
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    if (!requesterId) {
        throw new ApiError_1.default(401, "Unauthorized");
    }
    if (requesterRole !== "admin" && requesterId !== targetUserId) {
        throw new ApiError_1.default(403, "Not authorized to access this resource");
    }
}
/**
 * Returns the authenticated user's profile together with emergency contacts.
 */
const getProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    if (!userId) {
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const [user, contacts] = (await Promise.all([
        models_1.UserModel.findOne({ id: userId }).lean(),
        models_1.EmergencyContactModel.find({ userId }).sort({ createdAt: -1 }).lean(),
    ]));
    if (!user) {
        throw new ApiError_1.default(404, "User not found");
    }
    return res
        .status(200)
        .json(new ApiResponse_1.default(200, "Profile retrieved", serializeUserProfile(user, contacts)));
});
exports.getProfile = getProfile;
const getAllUsers = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const users = (await models_1.UserModel.find({})
        .sort({ createdAt: -1 })
        .lean());
    return res.status(200).json(new ApiResponse_1.default(200, "Users retrieved", users.map((user) => serializeUserSummary(user))));
});
exports.getAllUsers = getAllUsers;
const getUserById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const user = (await models_1.UserModel.findOne({ id }).lean());
    if (!user) {
        throw new ApiError_1.default(404, "User not found");
    }
    return res
        .status(200)
        .json(new ApiResponse_1.default(200, "User retrieved", serializeUserSummary(user)));
});
exports.getUserById = getUserById;
const getUserContacts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = String(req.params.id);
    canAccessUserResource(req, id);
    const user = (await models_1.UserModel.findOne({ id }).lean());
    if (!user) {
        throw new ApiError_1.default(404, "User not found");
    }
    const contacts = (await models_1.EmergencyContactModel.find({ userId: id })
        .sort({ createdAt: -1 })
        .lean());
    return res.status(200).json(new ApiResponse_1.default(200, "User emergency contacts retrieved", contacts.map((contact) => ({
        id: contact.id,
        userId: contact.userId,
        name: contact.name,
        relationship: contact.relationship,
        phoneNumber: contact.phoneNumber,
        isCommonContact: contact.isCommanContact,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
    }))));
});
exports.getUserContacts = getUserContacts;
const getUserRequests = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = String(req.params.id);
    canAccessUserResource(req, id);
    const user = (await models_1.UserModel.findOne({ id }).lean());
    if (!user) {
        throw new ApiError_1.default(404, "User not found");
    }
    const requests = (await models_1.EmergencyRequestModel.find({ userId: id })
        .sort({ createdAt: -1 })
        .lean());
    return res.status(200).json(new ApiResponse_1.default(200, "User emergency requests retrieved", requests.map((request) => ({
        id: request.id,
        userId: request.userId,
        serviceType: request.serviceType,
        requestStatus: request.requestStatus,
        requestTime: request.requestTime,
        dispatchTime: request.dispatchTime,
        arrivalTime: request.arrivalTime,
        description: request.description,
        location: request.location,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
    }))));
});
exports.getUserRequests = getUserRequests;
const getUserResponses = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = String(req.params.id);
    const user = (await models_1.UserModel.findOne({ id }).lean());
    if (!user) {
        throw new ApiError_1.default(404, "User not found");
    }
    const requests = (await models_1.EmergencyRequestModel.find({ userId: id })
        .select({ id: 1, _id: 0 })
        .lean());
    const requestIds = requests.map((request) => request.id);
    const responses = requestIds.length === 0
        ? []
        : (await models_1.EmergencyResponseModel.find({
            emergencyRequestId: { $in: requestIds },
        })
            .sort({ createdAt: -1 })
            .lean());
    return res.status(200).json(new ApiResponse_1.default(200, "User emergency responses retrieved", responses.map((response) => ({
        id: response.id,
        emergencyRequestId: response.emergencyRequestId,
        serviceProviderId: response.serviceProviderId,
        statusUpdate: response.statusUpdate,
        originLocation: response.originLocation,
        destinationLocation: response.destinationLocation,
        assignedAt: response.assignedAt,
        respondedAt: response.respondedAt,
        updateDescription: response.updateDescription,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
    }))));
});
exports.getUserResponses = getUserResponses;
/**
 * Updates mutable profile fields, including medical information and current location.
 */
const updateProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    if (!userId) {
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const payload = updateProfileSchema.parse(req.body);
    const updateData = { ...payload };
    if (payload.phoneNumber) {
        updateData.phoneNumber = Number(payload.phoneNumber);
    }
    const updatedUser = (await models_1.UserModel.findOneAndUpdate({ id: userId }, updateData, {
        new: true,
    }).lean());
    if (!updatedUser) {
        throw new ApiError_1.default(404, "User not found");
    }
    const contacts = (await models_1.EmergencyContactModel.find({ userId })
        .sort({ createdAt: -1 })
        .lean());
    return res
        .status(200)
        .json(new ApiResponse_1.default(200, "Profile updated", serializeUserProfile(updatedUser, contacts)));
});
exports.updateProfile = updateProfile;
