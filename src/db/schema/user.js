"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUserSchema = exports.newUserSchema = exports.usersSchema = exports.user = exports.userRolesEnum = exports.userRolesSchema = exports.userRolesValues = void 0;
const zod_1 = require("zod");
const models_1 = require("../../db/models");
const helpers_1 = require("./helpers");
exports.userRolesValues = ["admin", "user"];
exports.userRolesSchema = zod_1.z.enum(exports.userRolesValues);
exports.userRolesEnum = {
    enumValues: exports.userRolesValues,
    schema: exports.userRolesSchema,
};
exports.user = (0, helpers_1.createTable)("user", models_1.UserModel, [
    "id",
    "name",
    "age",
    "phoneNumber",
    "email",
    "primaryAddress",
    "password",
    "isVerified",
    "role",
    "profilePicture",
    "verificationToken",
    "tokenExpiry",
    "currentLocation",
    "medicalInfo",
    "resetPasswordToken",
    "resetPasswordTokenExpiry",
    "createdAt",
    "updatedAt",
    "pushToken",
]);
exports.usersSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    age: zod_1.z.number(),
    phoneNumber: zod_1.z.number(),
    email: zod_1.z.string().email(),
    primaryAddress: zod_1.z.string(),
    password: zod_1.z.string(),
    isVerified: zod_1.z.boolean().optional(),
    role: exports.userRolesSchema.optional(),
    profilePicture: zod_1.z.string().nullish(),
    verificationToken: zod_1.z.string().nullish(),
    tokenExpiry: zod_1.z.coerce.date().nullish(),
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
    resetPasswordToken: zod_1.z.string().nullish(),
    resetPasswordTokenExpiry: zod_1.z.coerce.date().nullish(),
    createdAt: zod_1.z.coerce.date().optional(),
    updatedAt: zod_1.z.coerce.date().optional(),
    pushToken: zod_1.z.string().nullish(),
});
exports.newUserSchema = exports.usersSchema
    .pick({
    name: true,
    age: true,
    phoneNumber: true,
    email: true,
    primaryAddress: true,
    password: true,
})
    .extend({
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});
exports.loginUserSchema = zod_1.z.object({
    phoneNumber: zod_1.z.coerce.number(),
    password: zod_1.z.string(),
});
