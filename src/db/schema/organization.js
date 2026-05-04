"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newOrganizationSchema = exports.organizationSchema = exports.organization = exports.orgStatusEnum = exports.orgStatusValues = void 0;
const zod_1 = require("zod");
const models_1 = require("../../db/models");
const helpers_1 = require("./helpers");
const enums_1 = require("./enums");
exports.orgStatusValues = [
    "not_active",
    "active",
    "not_verified",
];
exports.orgStatusEnum = {
    enumValues: exports.orgStatusValues,
    schema: zod_1.z.enum(exports.orgStatusValues),
};
exports.organization = (0, helpers_1.createTable)("organization", models_1.OrganizationModel, [
    "id",
    "name",
    "serviceCategory",
    "generalNumber",
    "status",
    "createdAt",
    "updatedAt",
]);
exports.organizationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    serviceCategory: zod_1.z.enum(enums_1.serviceTypeValues),
    generalNumber: zod_1.z.number(),
    status: zod_1.z.enum(exports.orgStatusValues).optional(),
    createdAt: zod_1.z.coerce.date().optional(),
    updatedAt: zod_1.z.coerce.date().optional(),
});
exports.newOrganizationSchema = exports.organizationSchema.pick({
    name: true,
    serviceCategory: true,
    generalNumber: true,
});
