"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emergencyContactSchema = exports.emergencyContact = void 0;
const zod_1 = require("zod");
const models_1 = require("../../db/models");
const helpers_1 = require("./helpers");
exports.emergencyContact = (0, helpers_1.createTable)("emergencyContact", models_1.EmergencyContactModel, [
    "id",
    "name",
    "isCommonContact",
    "relationship",
    "phoneNumber",
    "userId",
    "createdAt",
    "updatedAt",
]);
exports.emergencyContactSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    isCommanContact: zod_1.z.boolean().optional(),
    relationship: zod_1.z.string(),
    phoneNumber: zod_1.z.string(),
    userId: zod_1.z.string().nullish(),
    createdAt: zod_1.z.coerce.date().optional(),
    updatedAt: zod_1.z.coerce.date().optional(),
});
