"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newEmergencyRequestSchema = exports.emergencyRequestSchema = exports.emergencyRequest = exports.requestStatusEnum = exports.requestStatusValues = void 0;
const zod_1 = require("zod");
const models_1 = require("../../db/models");
const helpers_1 = require("./helpers");
const enums_1 = require("./enums");
exports.requestStatusValues = [
    "pending",
    "assigned",
    "rejected",
    "in_progress",
    "completed",
];
exports.requestStatusEnum = {
    enumValues: exports.requestStatusValues,
    schema: zod_1.z.enum(exports.requestStatusValues),
};
exports.emergencyRequest = (0, helpers_1.createTable)("emergencyRequest", models_1.EmergencyRequestModel, [
    "id",
    "userId",
    "serviceType",
    "requestStatus",
    "requestTime",
    "dispatchTime",
    "arrivalTime",
    "description",
    "location",
    "createdAt",
    "updatedAt",
]);
exports.emergencyRequestSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    serviceType: zod_1.z.enum(enums_1.serviceTypeValues),
    requestStatus: zod_1.z.enum(exports.requestStatusValues).optional(),
    requestTime: zod_1.z.coerce.date().optional(),
    dispatchTime: zod_1.z.coerce.date().nullish(),
    arrivalTime: zod_1.z.coerce.date().nullish(),
    description: zod_1.z.string().nullish(),
    location: zod_1.z.object({
        latitude: zod_1.z.string(),
        longitude: zod_1.z.string(),
    }),
    createdAt: zod_1.z.coerce.date().optional(),
    updatedAt: zod_1.z.coerce.date().optional(),
});
exports.newEmergencyRequestSchema = exports.emergencyRequestSchema.pick({
    userId: true,
    serviceType: true,
    description: true,
    location: true,
});
