
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMyProfile = exports.updateMyLocation = exports.resetPassword = exports.verifyRegistration = exports.register = exports.sendRegistrationOtp = exports.login = exports.forgotPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const models_1 = require("../db/models");
const ApiError_1 = __importDefault(require("../utils/api/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/api/ApiResponse"));
const asyncHandler_1 = require("../utils/api/asyncHandler");
const jwtTokens_1 = require("../utils/tokens/jwtTokens");
const email_1 = require("../utils/services/email");
const zod_1 = require("zod");
/** Accept string or number from JSON clients; keep digits only */
const phoneInput = zod_1.z.preprocess((v) => (v == null ? "" : String(v).replace(/\D/g, "").trim()), zod_1.z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"));
const passwordInput = zod_1.z.preprocess((v) => (v == null ? "" : String(v).trim()), zod_1.z.string().min(8, "Password must be at least 8 characters"));
const otpInput = zod_1.z.preprocess((v) => (v == null ? "" : String(v).trim()), zod_1.z.string().min(1, "OTP is required"));
const fullNameInput = zod_1.z
    .string()
    .trim()
    .refine((value) => value.split(/\s+/).filter(Boolean).length >= 2, "Full name must include at least first and last name");
const registerSchema = zod_1.z.object({
    name: fullNameInput,
    phoneNumber: phoneInput,
    email: zod_1.z.string().email(),
    password: passwordInput,
    primaryAddress: zod_1.z.string().min(3),
    age: zod_1.z.coerce.number().int().min(1),
    otpToken: otpInput,
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
const sendRegistrationOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
const resetPasswordSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    otpToken: zod_1.z.string().min(1),
    password: passwordInput,
});
const verifyRegistrationSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    otpToken: zod_1.z.string().min(1),
});
const locationSchema = zod_1.z.object({
    latitude: zod_1.z.coerce.string().min(1),
    longitude: zod_1.z.coerce.string().min(1),
});
const profileSchema = zod_1.z.object({
    name: fullNameInput.optional(),
    email: zod_1.z.string().email().optional(),
    phoneNumber: phoneInput.optional(),
    primaryAddress: zod_1.z.string().min(3).optional(),
});
const pendingRegistrationOtps = new Map();
function getPendingRegistrationOtp(email) {
    const key = email.toLowerCase();
    const pendingOtp = pendingRegistrationOtps.get(key);
    if (!pendingOtp) {
        return null;
    }
    if (Date.now() > pendingOtp.expiresAt) {
        pendingRegistrationOtps.delete(key);
        return null;
    }
    return pendingOtp;
}
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
function toSafeServiceProvider(provider) {
    return {
        id: provider.id || provider._id,
        name: provider.name,
        age: provider.age,
        email: provider.email,
        phoneNumber: String(provider.phoneNumber),
        primaryAddress: provider.primaryAddress,
        role: "admin",
        serviceType: provider.serviceType,
        serviceArea: provider.serviceArea,
        serviceStatus: provider.serviceStatus,
        currentLocation: provider.currentLocation || null,
        vehicleInformation: provider.vehicleInformation || {},
        pushToken: provider.pushToken || null,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt,
    };
}
/**
 * Sends an OTP to the email before a user account is created.
 */
const sendRegistrationOtp = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const payload = sendRegistrationOtpSchema.parse(req.body);
    const existingUser = await models_1.UserModel.findOne({ email: payload.email }).lean();
    const existingServiceProvider = await models_1.ServiceProviderModel.findOne({ email: payload.email }).lean();
    if (existingUser || existingServiceProvider) {
        throw new ApiError_1.default(409, "A user with that email already exists");
    }
    const otpToken = await (0, email_1.sendOTP)(payload.email);
    pendingRegistrationOtps.set(payload.email.toLowerCase(), {
        otpToken,
        expiresAt: Date.now() + 10 * 60 * 1000,
    });
    return res.status(200).json(new ApiResponse_1.default(200, "Registration OTP sent successfully", {
        email: payload.email,
    }));
});
exports.sendRegistrationOtp = sendRegistrationOtp;
/**
 * Registers a new mobile app user with a hashed password and optional medical profile.
 */
const register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const payload = registerSchema.parse(req.body);
    const pendingOtp = getPendingRegistrationOtp(payload.email);
    if (!pendingOtp) {
        throw new ApiError_1.default(400, "Please send an OTP to this email before registering");
    }
    if (payload.otpToken !== pendingOtp.otpToken) {
        throw new ApiError_1.default(400, "Invalid OTP");
    }
    const existingUser = (await models_1.UserModel.findOne({
        $or: [{ email: payload.email }, { phoneNumber: Number(payload.phoneNumber) }],
    }).lean());
    const existingServiceProvider = (await models_1.ServiceProviderModel.findOne({
        $or: [{ email: payload.email }, { phoneNumber: Number(payload.phoneNumber) }],
    }).lean());
    if (existingUser || existingServiceProvider) {
        const existingAccount = existingUser || existingServiceProvider;
        if (existingAccount.email === payload.email) {
            throw new ApiError_1.default(409, "A user with that email already exists");
        }
        throw new ApiError_1.default(409, "A user with that phone number already exists");
    }
    const password = await bcryptjs_1.default.hash(payload.password, 10);
    const user = (await models_1.UserModel.create({
        ...payload,
        otpToken: undefined,
        phoneNumber: Number(payload.phoneNumber),
        password,
        role: payload.role || "user",
        isVerified: true,
    }));
    pendingRegistrationOtps.delete(payload.email.toLowerCase());
    const token = (0, jwtTokens_1.generateJWT)(user.toObject());
    return res.status(201).json(new ApiResponse_1.default(201, "User registered successfully", {
        token,
        user: toSafeUser(user.toObject()),
    }));
});
exports.register = register;
/**
 * Verifies a newly registered user before issuing a login token.
 */
const verifyRegistration = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const payload = verifyRegistrationSchema.parse(req.body);
    const user = (await models_1.UserModel.findOne({ id: payload.userId }));
    if (!user) {
        throw new ApiError_1.default(404, "User not found");
    }
    if (!user.verificationToken || !user.tokenExpiry) {
        throw new ApiError_1.default(400, "Registration OTP not found");
    }
    const tokenExpiry = new Date(user.tokenExpiry);
    if (Date.now() > tokenExpiry.getTime()) {
        throw new ApiError_1.default(400, "Verification token expired");
    }
    if (payload.otpToken !== user.verificationToken) {
        throw new ApiError_1.default(400, "Invalid OTP");
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    user.tokenExpiry = undefined;
    await user.save();
    const token = (0, jwtTokens_1.generateJWT)(user.toObject());
    return res.status(200).json(new ApiResponse_1.default(200, "User verified successfully", {
        token,
        user: toSafeUser(user.toObject()),
    }));
});
exports.verifyRegistration = verifyRegistration;
/**
 * Authenticates a user and returns a JWT for mobile clients.
 */
const login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const payload = loginSchema.parse(req.body);
    const user = (await models_1.UserModel.findOne({
        phoneNumber: Number(payload.phoneNumber),
    }));
    if (user) {
        if (!user.isVerified) {
            throw new ApiError_1.default(403, "Please verify your email OTP before signing in");
        }
        const isPasswordValid = await bcryptjs_1.default.compare(payload.password, user.password);
        if (isPasswordValid) {
            const token = (0, jwtTokens_1.generateJWT)(user.toObject());
            return res.status(200).json(new ApiResponse_1.default(200, "Login successful", {
                token,
                user: toSafeUser(user.toObject()),
            }));
        }
    }
    const serviceProvider = (await models_1.ServiceProviderModel.findOne({
        phoneNumber: Number(payload.phoneNumber),
    }));
    if (!serviceProvider) {
        throw new ApiError_1.default(401, "Invalid credentials");
    }
    const isServiceProviderPasswordValid = await bcryptjs_1.default.compare(payload.password, serviceProvider.password);
    if (!isServiceProviderPasswordValid) {
        throw new ApiError_1.default(401, "Invalid credentials");
    }
    const safeServiceProvider = toSafeServiceProvider(serviceProvider.toObject());
    const token = (0, jwtTokens_1.generateJWT)(safeServiceProvider);
    return res.status(200).json(new ApiResponse_1.default(200, "Login successful", {
        token,
        user: safeServiceProvider,
        serviceProvider: safeServiceProvider,
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
const updateMyLocation = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const location = locationSchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) {
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const serviceProvider = await models_1.ServiceProviderModel.findOneAndUpdate({ id: userId }, { currentLocation: location }, { new: true }).lean();
    if (serviceProvider) {
        return res.status(200).json(new ApiResponse_1.default(200, "Location updated", toSafeServiceProvider(serviceProvider)));
    }
    const user = await models_1.UserModel.findOneAndUpdate({ id: userId }, { currentLocation: location }, { new: true }).lean();
    if (!user) {
        throw new ApiError_1.default(404, "Account not found");
    }
    return res.status(200).json(new ApiResponse_1.default(200, "Location updated", toSafeUser(user)));
});
exports.updateMyLocation = updateMyLocation;
const updateMyProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const payload = profileSchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) {
        throw new ApiError_1.default(401, "Unauthorized");
    }
    if (Object.keys(payload).length === 0) {
        throw new ApiError_1.default(400, "No profile data provided");
    }
    const updateData = { ...payload };
    if (payload.phoneNumber) {
        updateData.phoneNumber = Number(payload.phoneNumber);
    }
    const serviceProvider = await models_1.ServiceProviderModel.findOneAndUpdate({ id: userId }, updateData, { new: true }).lean();
    if (serviceProvider) {
        return res.status(200).json(new ApiResponse_1.default(200, "Profile updated", toSafeServiceProvider(serviceProvider)));
    }
    const user = await models_1.UserModel.findOneAndUpdate({ id: userId }, updateData, { new: true }).lean();
    if (!user) {
        throw new ApiError_1.default(404, "Account not found");
    }
    return res.status(200).json(new ApiResponse_1.default(200, "Profile updated", toSafeUser(user)));
});
exports.updateMyProfile = updateMyProfile;
