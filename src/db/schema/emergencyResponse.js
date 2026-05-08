"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emergencyResponseSchema = exports.emergencyResponse = exports.statusUpdateEnum = exports.statusUpdateValues = void 0;
const zod_1 = require("zod");
const models_1 = require("../../db/models");
const helpers_1 = require("./helpers");
exports.statusUpdateValues = [
    "accepted",
    "arrived",
    "on_route",
    "rejected",
];
exports.statusUpdateEnum = {
    enumValues: exports.statusUpdateValues,
    schema: zod_1.z.enum(exports.statusUpdateValues),
};
exports.emergencyResponse = (0, helpers_1.createTable)("emergencyResponse", models_1.EmergencyResponseModel, [
    "id",
    "emergencyRequestId",
    "serviceProviderId",
    "statusUpdate",
    "originLocation",
    "destinationLocation",
    "assignedAt",
    "respondedAt",
    "updateDescription",
    "createdAt",
    "updatedAt",
]);
exports.emergencyResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    emergencyRequestId: zod_1.z.string().nullish(),
    serviceProviderId: zod_1.z.string().nullish(),
    statusUpdate: zod_1.z.enum(exports.statusUpdateValues).optional(),
    originLocation: zod_1.z.object({
        latitude: zod_1.z.string(),
        longitude: zod_1.z.string(),
    }),
    destinationLocation: zod_1.z.object({
        latitude: zod_1.z.string(),
        longitude: zod_1.z.string(),
    }),
    assignedAt: zod_1.z.coerce.date().nullish(),
    respondedAt: zod_1.z.coerce.date().optional(),
    updateDescription: zod_1.z.string().nullish(),
    createdAt: zod_1.z.coerce.date().optional(),
    updatedAt: zod_1.z.coerce.date().optional(),
});
