"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listContacts = exports.createContact = void 0;
const models_1 = require("../db/models");
const ApiError_1 = __importDefault(require("../utils/api/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/api/ApiResponse"));
const asyncHandler_1 = require("../utils/api/asyncHandler");
const zod_1 = require("zod");
const contactSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    relationship: zod_1.z.string().min(2),
    phoneNumber: zod_1.z.string().min(7),
    isCommonContact: zod_1.z.boolean().optional(),
});
/**
 * Adds a new emergency contact for the authenticated user.
 */
const createContact = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    if (!userId) {
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const payload = contactSchema.parse(req.body);
    const contact = (await models_1.EmergencyContactModel.create({
        userId,
        name: payload.name,
        relationship: payload.relationship,
        phoneNumber: payload.phoneNumber,
        isCommanContact: payload.isCommonContact || false,
    }));
    return res.status(201).json(new ApiResponse_1.default(201, "Emergency contact created", {
        id: contact.id,
        name: contact.name,
        relationship: contact.relationship,
        phoneNumber: contact.phoneNumber,
        isCommonContact: contact.isCommanContact,
    }));
});
exports.createContact = createContact;
/**
 * Lists the authenticated user's emergency contacts.
 */
const listContacts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    if (!userId) {
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const contacts = (await models_1.EmergencyContactModel.find({ userId })
        .sort({ createdAt: -1 })
        .lean());
    return res.status(200).json(new ApiResponse_1.default(200, "Emergency contacts retrieved", contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        relationship: contact.relationship,
        phoneNumber: contact.phoneNumber,
        isCommonContact: contact.isCommanContact,
    }))));
});
exports.listContacts = listContacts;
