"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.getProfile = exports.verifyUser = exports.getUser = exports.updateUser = exports.logoutUser = exports.loginUser = exports.registerUser = exports.updatePushToken = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const query_1 = require("../db/query");
const db_1 = __importDefault(require("../db"));
const ApiError_1 = __importDefault(require("../utils/api/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/api/ApiResponse"));
const asyncHandler_1 = require("../utils/api/asyncHandler");
const user_1 = require("../db/schema/user");
const jwtTokens_1 = require("../utils/tokens/jwtTokens");
const config_1 = require("../config");
const utils_1 = require("../utils");
const email_1 = require("../utils/services/email");
const registerUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { name, phoneNumber, age, email, password, primaryAddress, role } = req.body;
    const parsedValues = user_1.newUserSchema.safeParse({
        name,
        phoneNumber,
        age,
        email,
        password,
        primaryAddress,
    });
    if (role && role == "admin" && !config_1.adminEmails.includes(email)) {
        console.log("Admin email not authorized");
        throw new ApiError_1.default(401, "Admin email not authorized");
    }
    if (phoneNumber && /^[0-9]{10}$/.exec(phoneNumber) === null) {
        console.log("Invalid phone number");
        throw new ApiError_1.default(400, "Invalid phone number");
    }
    if (!parsedValues.success) {
        const validationError = new ApiError_1.default(400, "Error validating data", parsedValues.error.errors.map((error) => `${error.path[0]} : ${error.message} `));
        console.log("Validation error", validationError);
        return res.status(400).json(validationError);
    }
    const existingUser = await db_1.default.query.user.findFirst({
        where: (0, query_1.or)((0, query_1.eq)(user_1.user.phoneNumber, phoneNumber), (0, query_1.eq)(user_1.user.email, email)),
    });
    if (existingUser) {
        console.log("User with this email or phone number already exists");
        throw new ApiError_1.default(400, "User with this email or phone number already exists");
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const newUser = await db_1.default
        .insert(user_1.user)
        .values({
        ...parsedValues.data,
        password: hashedPassword,
        isVerified: true,
    })
        .returning({
        name: user_1.user.name,
        age: user_1.user.age,
        phoneNumber: user_1.user.phoneNumber,
        email: user_1.user.email,
        primaryAddress: user_1.user.primaryAddress,
    });
    if (!newUser) {
        console.log("Error registering user. Please try again");
        throw new ApiError_1.default(400, "Error registering user. Please try again");
    }
    res
        .status(201)
        .json(new ApiResponse_1.default(201, "User registered successfully", { user: newUser[0] }));
});
exports.registerUser = registerUser;
const loginUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    console.log(req.body);
    const parsedValues = user_1.loginUserSchema.safeParse(req.body);
    if (!parsedValues.success) {
        const validationError = new ApiError_1.default(400, "Error validating data", parsedValues.error.errors.map((error) => `${error.path[0]} : ${error.message} `));
        return res.status(400).json(validationError);
    }
    const { phoneNumber, password } = parsedValues.data;
    const existingUser = await db_1.default.query.user.findFirst({
        where: (0, query_1.eq)(user_1.user.phoneNumber, phoneNumber),
        columns: {
            id: true,
            name: true,
            phoneNumber: true,
            email: true,
            age: true,
            primaryAddress: true,
            role: true,
            password: true,
            isVerified: true,
        },
    });
    if (!existingUser) {
        console.log("User not found");
        throw new ApiError_1.default(400, "User not found");
    }
    const isPasswordValid = await bcryptjs_1.default.compare(password, existingUser.password);
    if (!isPasswordValid) {
        console.log("Invalid credentials");
        throw new ApiError_1.default(400, "Invalid credentials");
    }
    const token = (0, jwtTokens_1.generateJWT)(existingUser);
    const loggedInUser = JSON.parse(JSON.stringify(existingUser));
    delete loggedInUser.password;
    res
        .status(200)
        .cookie("token", token)
        .json(new ApiResponse_1.default(200, `${(0, utils_1.capitalizeFirstLetter)(loggedInUser.role?.toString() ?? "user")} logged in successfully`, {
        user: loggedInUser,
        token,
    }));
});
exports.loginUser = loginUser;
const logoutUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const loggedInUser = req.user;
    if (!loggedInUser || !loggedInUser.id) {
        console.log("Unauthorized");
        throw new ApiError_1.default(401, "Unauthorized");
    }
    console.log(loggedInUser);
    const existingUser = await db_1.default.query.user.findFirst({
        where: (0, query_1.eq)(user_1.user.id, loggedInUser.id),
        columns: {
            id: true,
            name: true,
            phoneNumber: true,
            email: true,
            age: true,
            primaryAddress: true,
        },
    });
    if (!existingUser) {
        console.log("Unauthorized User");
        throw new ApiError_1.default(401, "Unauthorized User");
    }
    res
        .status(200)
        .clearCookie("token")
        .json(new ApiResponse_1.default(200, "User logged out successfully", {
        user: existingUser,
    }));
});
exports.logoutUser = logoutUser;
const updateUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const loggedInUser = req.user;
    if (!loggedInUser || !loggedInUser.id) {
        console.log("Unauthorized");
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const existingUser = await db_1.default.query.user.findFirst({
        where: (0, query_1.eq)(user_1.user.id, loggedInUser.id),
    });
    if (!existingUser) {
        console.log("Unauthorized");
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const updateData = req.body;
    if (Object.keys(updateData).length === 0) {
        console.log("No data to update");
        throw new ApiError_1.default(400, "No data to update");
    }
    const invalidKeys = Object.keys(updateData).filter((key) => !Object.keys(user_1.user).includes(key));
    if (invalidKeys.length > 0) {
        console.log(`Invalid data to update. Invalid keys: ${invalidKeys}`);
        throw new ApiError_1.default(400, `Invalid data to update. Invalid keys: ${invalidKeys}`);
    }
    const updatedUser = await db_1.default
        .update(user_1.user)
        .set(updateData)
        .where((0, query_1.eq)(user_1.user.id, loggedInUser.id))
        .returning({
        id: user_1.user.id,
        name: user_1.user.name,
        phoneNumber: user_1.user.phoneNumber,
        age: user_1.user.age,
        email: user_1.user.email,
        primaryAddress: user_1.user.primaryAddress,
    });
    if (!updatedUser.length) {
        console.log("Failed to update user");
        throw new ApiError_1.default(500, "Failed to update user");
    }
    res.status(200).json(new ApiResponse_1.default(200, "User updated successfully", {
        user: updatedUser[0],
    }));
});
exports.updateUser = updateUser;
const getProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const loggedInUser = req.user;
    if (!loggedInUser || !loggedInUser.id) {
        console.log("Unauthorized");
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const existingUser = await db_1.default.query.user.findFirst({
        where: (0, query_1.eq)(user_1.user.id, loggedInUser.id),
        columns: {
            password: false,
            verificationToken: false,
            tokenExpiry: false,
        },
    });
    if (!existingUser) {
        console.log("User not found");
        throw new ApiError_1.default(404, "User not found");
    }
    res
        .status(200)
        .json(new ApiResponse_1.default(200, "User found", { user: existingUser }));
});
exports.getProfile = getProfile;
const getUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const loggedInUser = req.user;
    if (!loggedInUser || loggedInUser.role !== "admin") {
        console.log("User not authorized");
        throw new ApiError_1.default(401, "User not authorized");
    }
    const existingUser = await db_1.default.query.user.findFirst({
        where: (0, query_1.eq)(user_1.user.id, userId),
        columns: {
            password: false,
            verificationToken: false,
            tokenExpiry: false,
        },
    });
    if (!existingUser) {
        console.log("User not found");
        throw new ApiError_1.default(404, "User not found");
    }
    res
        .status(200)
        .json(new ApiResponse_1.default(200, "User fetched successfully", { user: existingUser }));
});
exports.getUser = getUser;
const verifyUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { otpToken, userId } = req.body;
    if (!otpToken) {
        console.log("Please provide OTP");
        throw new ApiError_1.default(400, "Please provide OTP");
    }
    if (!userId) {
        console.log("Please provide user ID");
        throw new ApiError_1.default(400, "Please provide user ID");
    }
    const existingUser = await db_1.default.query.user.findFirst({
        where: (0, query_1.eq)(user_1.user.id, userId),
        columns: {
            password: false,
        },
    });
    if (!existingUser) {
        console.log("User not found");
        throw new ApiError_1.default(400, "User not found");
    }
    if (!user_1.user.verificationToken || !user_1.user.tokenExpiry) {
        console.log("Verification token not found");
        throw new ApiError_1.default(400, "Verification token not found");
    }
    if (!existingUser.tokenExpiry) {
        console.log("Verification token expiry not registered. Please verify again.");
        throw new ApiError_1.default(400, "Verification token expiry not registered. Please verify again.");
    }
    const tokenExpiry = new Date(existingUser.tokenExpiry);
    const currentTime = new Date(Date.now()).toISOString();
    if (new Date(currentTime) < tokenExpiry) {
        console.log("Verification token expired");
        throw new ApiError_1.default(400, "Verification token expired");
    }
    if (otpToken !== existingUser.verificationToken) {
        console.log("Invalid OTP");
        throw new ApiError_1.default(400, "Invalid OTP");
    }
    const updatedUser = await db_1.default
        .update(user_1.user)
        .set({
        isVerified: true,
        verificationToken: null,
        tokenExpiry: null,
    })
        .returning({
        id: user_1.user.id,
        name: user_1.user.name,
        phoneNumber: user_1.user.phoneNumber,
        isVerified: user_1.user.isVerified,
    });
    if (!updatedUser.length || !updatedUser[0].isVerified) {
        console.log("Failed to verify user");
        throw new ApiError_1.default(500, "Failed to verify user");
    }
    res.status(200).json(new ApiResponse_1.default(200, "User verified successfully", {
        user: updatedUser[0],
    }));
});
exports.verifyUser = verifyUser;
const forgotPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, phoneNumber } = req.body;
    if (!email && !phoneNumber) {
        console.log("Please provide email or phone number");
        throw new ApiError_1.default(400, "Please provide email or phone number");
    }
    const existingUser = await db_1.default.query.user.findFirst({
        where: (0, query_1.or)((0, query_1.eq)(user_1.user.email, email), (0, query_1.eq)(user_1.user.phoneNumber, phoneNumber)),
    });
    if (!existingUser) {
        console.log("User not found with given email or phone");
        throw new ApiError_1.default(404, "User not found with given email or phone");
    }
    const otpToken = await (0, email_1.sendOTP)(String(existingUser.email));
    if (!otpToken) {
        console.log("Error Sending OTP token. Please try again");
        throw new ApiError_1.default(300, "Error Sending OTP token. Please try again");
    }
    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const updatedUser = await db_1.default
        .update(user_1.user)
        .set({
        resetPasswordToken: otpToken,
        resetPasswordTokenExpiry: tokenExpiry.toISOString(),
    })
        .where((0, query_1.eq)(user_1.user.id, existingUser.id));
    if (!updatedUser) {
        console.log("Error setting verfication token");
        throw new ApiError_1.default(400, "Error setting verfication token");
    }
    res.status(200).json(new ApiResponse_1.default(200, "OTP sent to user for verification", {
        userId: existingUser.id,
    }));
});
exports.forgotPassword = forgotPassword;
const resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // TODO: Need to refactor this
    const { otpToken, userId, password } = req.body;
    if (!otpToken) {
        console.log("Please provide OTP");
        throw new ApiError_1.default(400, "Please provide OTP");
    }
    if (!userId) {
        console.log("Please provide user ID");
        throw new ApiError_1.default(400, "Please provide user ID");
    }
    if (!password) {
        console.log("Please provide new password");
        throw new ApiError_1.default(400, "Please provide new password");
    }
    const existingUser = await db_1.default.query.user.findFirst({
        where: (0, query_1.eq)(user_1.user.id, userId),
    });
    if (!existingUser) {
        console.log("User not found");
        throw new ApiError_1.default(400, "User not found");
    }
    if (!existingUser.resetPasswordToken ||
        !existingUser.resetPasswordTokenExpiry) {
        console.log("Reset Password token not found");
        throw new ApiError_1.default(400, "Reset Password token not found");
    }
    if (!existingUser.resetPasswordTokenExpiry) {
        console.log("Verification token expiry not registered. Please verify again.");
        throw new ApiError_1.default(400, "Verification token expiry not registered. Please verify again.");
    }
    const tokenExpiry = new Date(existingUser.resetPasswordTokenExpiry);
    if (Date.now() > tokenExpiry.getTime()) {
        console.log("Verification token expired");
        throw new ApiError_1.default(400, "Verification token expired");
    }
    if (otpToken !== existingUser.resetPasswordToken) {
        console.log("Invalid OTP");
        throw new ApiError_1.default(400, "Invalid OTP");
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const updatedUser = await db_1.default
        .update(user_1.user)
        .set({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
    })
        .returning({
        id: user_1.user.id,
        name: user_1.user.name,
        phoneNumber: user_1.user.phoneNumber,
        email: user_1.user.email,
    });
    if (!updatedUser.length) {
        console.log("Failed to update user");
        throw new ApiError_1.default(500, "Failed to update user");
    }
    res.status(200).json(new ApiResponse_1.default(200, "Password reset successfully", {
        user: updatedUser[0],
    }));
});
exports.resetPassword = resetPassword;
const changePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const loggedInUser = req.user;
    if (!loggedInUser || !loggedInUser.id) {
        console.log("Unauthorized");
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        console.log("Please provide old and new password");
        throw new ApiError_1.default(400, "Please provide old and new password");
    }
    if (!loggedInUser || !loggedInUser.id) {
        console.log("Unauthorized");
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const existingUser = await db_1.default.query.user.findFirst({
        where: (0, query_1.eq)(user_1.user.id, loggedInUser.id),
        columns: {
            id: true,
            name: true,
            phoneNumber: true,
            email: true,
            age: true,
            primaryAddress: true,
            password: true,
            isVerified: true,
        },
    });
    if (!existingUser) {
        console.log("Unauthorized");
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const isPasswordValid = await bcryptjs_1.default.compare(oldPassword, existingUser.password);
    if (!isPasswordValid) {
        console.log("Invalid credentials");
        throw new ApiError_1.default(400, "Invalid credentials");
    }
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
    const updatedUser = await db_1.default
        .update(user_1.user)
        .set({
        password: hashedPassword,
    })
        .where((0, query_1.eq)(user_1.user.id, loggedInUser.id))
        .returning({
        id: user_1.user.id,
        name: user_1.user.name,
        phoneNumber: user_1.user.phoneNumber,
        email: user_1.user.email,
        age: user_1.user.age,
        primaryAddress: user_1.user.primaryAddress,
        isVerified: user_1.user.isVerified,
    });
    if (!updatedUser.length) {
        throw new ApiError_1.default(500, "Failed to update user");
    }
    res.status(200).json(new ApiResponse_1.default(200, "Password updated successfully", {
        user: updatedUser[0],
    }));
});
exports.changePassword = changePassword;
exports.updatePushToken = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { pushToken } = req.body;
    const userId = req.user?.id;
    if (!userId) {
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const updatedUser = await db_1.default
        .update(user_1.user)
        .set({ pushToken })
        .where((0, query_1.eq)(user_1.user.id, userId))
        .returning();
    if (!updatedUser) {
        throw new ApiError_1.default(404, "User not found");
    }
    return res
        .status(200)
        .json(new ApiResponse_1.default(200, "Push token updated successfully", updatedUser[0]));
});
