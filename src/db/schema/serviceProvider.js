"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginServiceProviderSchema = exports.newServiceProviderSchema = exports.serviceProviderSchema = exports.serviceProvider = exports.statusTypeEnum = void 0;
const zod_1 = require("zod");
const models_1 = require("../../db/models");
const helpers_1 = require("./helpers");
const enums_1 = require("./enums");
exports.statusTypeEnum = {
    enumValues: enums_1.serviceStatusValues,
    schema: zod_1.z.enum(enums_1.serviceStatusValues),
};
exports.serviceProvider = (0, helpers_1.createTable)("serviceProvider", models_1.ServiceProviderModel, [
    "id",
    "name",
    "age",
    "email",
    "phoneNumber",
    "primaryAddress",
    "serviceArea",
    "password",
    "serviceType",
    "isVerified",
    "profilePicture",
    "organizationId",
    "currentLocation",
    "vehicleInformation",
    "serviceStatus",
    "verificationToken",
    "tokenExpiry",
    "resetPasswordToken",
    "resetPasswordTokenExpiry",
    "pushToken",
    "createdAt",
    "updatedAt",
]);
exports.serviceProviderSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    age: zod_1.z.number(),
    email: zod_1.z.string().email(),
    phoneNumber: zod_1.z.number(),
    primaryAddress: zod_1.z.string(),
    serviceArea: zod_1.z.string().optional(),
    password: zod_1.z.string(),
    serviceType: zod_1.z.enum(enums_1.serviceTypeValues),
    isVerified: zod_1.z.boolean().optional(),
    profilePicture: zod_1.z.string().nullish(),
    organizationId: zod_1.z.string(),
    currentLocation: zod_1.z
        .object({
        latitude: zod_1.z.string(),
        longitude: zod_1.z.string(),
    })
        .optional(),
    vehicleInformation: zod_1.z
        .object({
        type: zod_1.z.string(),
        number: zod_1.z.string(),
        model: zod_1.z.string(),
        color: zod_1.z.string(),
    })
        .optional(),
    serviceStatus: zod_1.z.enum(enums_1.serviceStatusValues).optional(),
    verificationToken: zod_1.z.string().nullish(),
    tokenExpiry: zod_1.z.coerce.date().nullish(),
    resetPasswordToken: zod_1.z.string().nullish(),
    resetPasswordTokenExpiry: zod_1.z.coerce.date().nullish(),
    pushToken: zod_1.z.string().nullish(),
    createdAt: zod_1.z.coerce.date().optional(),
    updatedAt: zod_1.z.coerce.date().optional(),
});
exports.newServiceProviderSchema = exports.serviceProviderSchema.pick({
    name: true,
    age: true,
    email: true,
    phoneNumber: true,
    primaryAddress: true,
    password: true,
    serviceType: true,
    organizationId: true,
});
exports.loginServiceProviderSchema = zod_1.z.object({
    phoneNumber: zod_1.z.coerce.number(),
    password: zod_1.z.string(),
});
