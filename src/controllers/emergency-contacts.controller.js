"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommonEmergencyContacts = exports.getUserEmergencyContacts = exports.getEmergencyContact = exports.deleteEmergencyContact = exports.updateEmergencyContact = exports.createEmergencyContact = void 0;
const db_1 = __importDefault(require("../db"));
const schema_1 = require("../db/schema");
const ApiError_1 = __importDefault(require("../utils/api/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/api/ApiResponse"));
const asyncHandler_1 = require("../utils/api/asyncHandler");
const query_1 = require("../db/query");
const createEmergencyContact = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { name, phoneNumber, isCommanContact, relationship } = req.body;
    const { id: userId } = req.user;
    if (!userId)
        throw new ApiError_1.default(401, "Unauthorized to perform this action");
    if (!name || !phoneNumber || !relationship) {
        throw new ApiError_1.default(400, "Missing required fields");
    }
    const newContact = await db_1.default
        .insert(schema_1.emergencyContact)
        .values({
        name,
        phoneNumber,
        relationship,
        isCommanContact: isCommanContact ?? false,
        userId,
    })
        .returning();
    res
        .status(201)
        .json(new ApiResponse_1.default(201, "Emergency contact created", newContact[0]));
});
exports.createEmergencyContact = createEmergencyContact;
const updateEmergencyContact = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { id: userId } = req.user;
    const updateData = req.body;
    if (!userId)
        throw new ApiError_1.default(401, "Unauthorized");
    const existing = await db_1.default.query.emergencyContact.findFirst({
        where: (0, query_1.eq)(schema_1.emergencyContact.id, id),
    });
    if (!existing)
        throw new ApiError_1.default(404, "Contact not found");
    if (existing.userId !== userId)
        throw new ApiError_1.default(403, "Forbidden");
    const allowedFields = [
        "name",
        "phoneNumber",
        "relationship",
        "isCommanContact",
    ];
    const invalidKeys = Object.keys(updateData).filter((key) => !allowedFields.includes(key));
    if (invalidKeys.length > 0) {
        throw new ApiError_1.default(400, `Invalid fields: ${invalidKeys.join(", ")}`);
    }
    const updated = await db_1.default
        .update(schema_1.emergencyContact)
        .set(updateData)
        .where((0, query_1.eq)(schema_1.emergencyContact.id, id))
        .returning();
    res
        .status(200)
        .json(new ApiResponse_1.default(200, "Emergency contact updated", updated[0]));
});
exports.updateEmergencyContact = updateEmergencyContact;
const deleteEmergencyContact = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { id: userId, role } = req.user;
    const contact = await db_1.default.query.emergencyContact.findFirst({
        where: (0, query_1.eq)(schema_1.emergencyContact.id, id),
    });
    if (!contact)
        throw new ApiError_1.default(404, "Contact not found");
    if (role !== "admin" && contact.userId !== userId) {
        throw new ApiError_1.default(403, "Unauthorized to delete this contact");
    }
    const deleted = await db_1.default
        .delete(schema_1.emergencyContact)
        .where((0, query_1.eq)(schema_1.emergencyContact.id, id))
        .returning();
    res
        .status(200)
        .json(new ApiResponse_1.default(200, "Emergency contact deleted", deleted[0]));
});
exports.deleteEmergencyContact = deleteEmergencyContact;
const getEmergencyContact = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const contact = await db_1.default.query.emergencyContact.findFirst({
        where: (0, query_1.eq)(schema_1.emergencyContact.id, id),
    });
    if (!contact)
        throw new ApiError_1.default(404, "Contact not found");
    res
        .status(200)
        .json(new ApiResponse_1.default(200, "Emergency contact found", contact));
});
exports.getEmergencyContact = getEmergencyContact;
const getUserEmergencyContacts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id: userId } = req.user;
    if (!userId)
        throw new ApiError_1.default(401, "Unauthorized");
    const contacts = await db_1.default
        .select()
        .from(schema_1.emergencyContact)
        .where((0, query_1.eq)(schema_1.emergencyContact.userId, userId))
        .orderBy((0, query_1.desc)(schema_1.emergencyContact.createdAt));
    res.status(200).json(new ApiResponse_1.default(200, "Contacts retrieved", contacts));
});
exports.getUserEmergencyContacts = getUserEmergencyContacts;
const getCommonEmergencyContacts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const contacts = await db_1.default
        .select()
        .from(schema_1.emergencyContact)
        .where((0, query_1.eq)(schema_1.emergencyContact.isCommanContact, true))
        .orderBy((0, query_1.desc)(schema_1.emergencyContact.createdAt));
    res
        .status(200)
        .json(new ApiResponse_1.default(200, "Common contacts retrieved", contacts));
});
exports.getCommonEmergencyContacts = getCommonEmergencyContacts;
