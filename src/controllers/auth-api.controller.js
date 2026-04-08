"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.register = exports.login = exports.forgotPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const models_1 = require("../db/models");
const ApiError_1 = __importDefault(require("../utils/api/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/api/ApiResponse"));
const asyncHandler_1 = require("../utils/api/asyncHandler");
const jwtTokens_1 = require("../utils/tokens/jwtTokens");
const email_1 = require("../utils/services/email");
const zod_1 = require("zod");
/** Accept string or number from JSON clients; keep digits only */
const phoneInput = zod_1.z.preprocess((v) => (v == null ? "" : String(v).replace(/\D/g, "").trim()), zod_1.z.string().min(7, "Phone number must be at least 7 digits"));
const passwordInput = zod_1.z.preprocess((v) => (v == null ? "" : String(v).trim()), zod_1.z.string().min(8, "Password must be at least 8 characters"));
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    phoneNumber: phoneInput,
    email: zod_1.z.string().email(),
    password: passwordInput,
    primaryAddress: zod_1.z.string().min(3),
    age: zod_1.z.coerce.number().int().min(1),
    role: zod_1.z.enum(["user", "admin"]).optional(),
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
const loginSchema = zod_1.z.object({
    phoneNumber: phoneInput,
    password: passwordInput,
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
const resetPasswordSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    otpToken: zod_1.z.string().min(1),
    password: passwordInput,
});
function toSafeUser(user) {
    return {
        id: user.id || user._id,
        name: user.name,
        age: user.age,
        email: user.email,
        phoneNumber: String(user.phoneNumber),
        primaryAddress: user.primaryAddress,
        role: user.role,
        medicalInfo: user.medicalInfo || {},
        currentLocation: user.currentLocation || null,
        pushToken: user.pushToken || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
/**
 * Registers a new mobile app user with a hashed password and optional medical profile.
 */
const register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const payload = registerSchema.parse(req.body);
    const existingUser = (await models_1.UserModel.findOne({
        $or: [{ email: payload.email }, { phoneNumber: Number(payload.phoneNumber) }],
    }).lean());
    if (existingUser) {
        throw new ApiError_1.default(409, "A user with that email or phone number already exists");
    }
    const password = await bcryptjs_1.default.hash(payload.password, 10);
    const user = (await models_1.UserModel.create({
        ...payload,
        phoneNumber: Number(payload.phoneNumber),
        password,
        role: payload.role || "user",
        isVerified: true,
    }));
    const token = (0, jwtTokens_1.generateJWT)(user.toObject());
    return res.status(201).json(new ApiResponse_1.default(201, "User registered successfully", {
        token,
        user: toSafeUser(user.toObject()),
    }));
});
exports.register = register;
/**
 * Authenticates a user and returns a JWT for mobile clients.
 */
const login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const payload = loginSchema.parse(req.body);
    const user = (await models_1.UserModel.findOne({
        phoneNumber: Number(payload.phoneNumber),
    }));
    if (!user) {
        throw new ApiError_1.default(401, "Invalid credentials");
    }
    const isPasswordValid = await bcryptjs_1.default.compare(payload.password, user.password);
    if (!isPasswordValid) {
        throw new ApiError_1.default(401, "Invalid credentials");
    }
    const token = (0, jwtTokens_1.generateJWT)(user.toObject());
    return res.status(200).json(new ApiResponse_1.default(200, "Login successful", {
        token,
        user: toSafeUser(user.toObject()),
    }));
});
exports.login = login;
/**
 * Starts a password reset flow by emailing an OTP token to the user.
 */
const forgotPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const payload = forgotPasswordSchema.parse(req.body);
    const user = (await models_1.UserModel.findOne({ email: payload.email }));
    if (!user) {
        throw new ApiError_1.default(404, "User not found");
    }
    const otpToken = await (0, email_1.sendOTP)(payload.email);
    user.resetPasswordToken = otpToken;
    user.resetPasswordTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    return res.status(200).json(new ApiResponse_1.default(200, "Password reset OTP sent successfully", {
        userId: user.id,
    }));
});
exports.forgotPassword = forgotPassword;
/**
 * Completes password reset using the OTP from email and the userId from forgot-password.
 */
const resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const payload = resetPasswordSchema.parse(req.body);
    const user = (await models_1.UserModel.findOne({ id: payload.userId }));
    if (!user) {
        throw new ApiError_1.default(404, "User not found");
    }
    if (!user.resetPasswordToken || !user.resetPasswordTokenExpiry) {
        throw new ApiError_1.default(400, "Reset Password token not found");
    }
    const tokenExpiry = new Date(user.resetPasswordTokenExpiry);
    if (Date.now() > tokenExpiry.getTime()) {
        throw new ApiError_1.default(400, "Verification token expired");
    }
    if (payload.otpToken !== user.resetPasswordToken) {
        throw new ApiError_1.default(400, "Invalid OTP");
    }
    user.password = await bcryptjs_1.default.hash(payload.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;
    await user.save();
    return res.status(200).json(new ApiResponse_1.default(200, "Password reset successfully", {
        user: toSafeUser(user.toObject()),
    }));
});
exports.resetPassword = resetPassword;
