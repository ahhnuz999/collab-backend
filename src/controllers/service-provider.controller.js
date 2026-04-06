"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNearbyProviders = exports.changeProviderPassword = exports.updateServiceProviderStatus = exports.getServiceProvider = exports.getServiceProviderProfile = exports.forgotServiceProviderPassword = exports.resetServiceProviderPassword = exports.deleteServiceProvider = exports.updateServiceProvider = exports.verifyServiceProvider = exports.logoutServiceProvider = exports.loginServiceProvider = exports.registerServiceProvider = void 0;
const asyncHandler_1 = require("../utils/api/asyncHandler");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const ApiError_1 = __importDefault(require("../utils/api/ApiError"));
const query_1 = require("../db/query");
const db_1 = __importDefault(require("../db"));
const schema_1 = require("../db/schema");
const ApiResponse_1 = __importDefault(require("../utils/api/ApiResponse"));
const jwtTokens_1 = require("../utils/tokens/jwtTokens");
const socket_1 = require("../socket");
const constants_1 = require("../constants");
const maps_1 = require("../utils/maps");
const notification_controller_1 = require("./notification.controller");
const email_1 = require("../utils/services/email");
const distance_1 = require("../utils/distance");
const registerServiceProvider = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsedValues = schema_1.newServiceProviderSchema.safeParse(req.body);
    if (!parsedValues.success) {
        console.log("Parsing Error: ", parsedValues.error.errors);
        const validationError = new ApiError_1.default(400, "Error validating data", parsedValues.error.errors.map((error) => `${error.path[0]} : ${error.message} `));
        return res.status(400).json(validationError);
    }
    if (parsedValues.data.phoneNumber &&
        /^[0-9]{10}$/.exec(parsedValues.data.phoneNumber.toString()) === null) {
        throw new ApiError_1.default(400, "Invalid phone number");
    }
    const existingServiceProvider = await db_1.default.query.serviceProvider.findFirst({
        where: (0, query_1.or)((0, query_1.eq)(schema_1.serviceProvider.phoneNumber, parsedValues.data.phoneNumber), (0, query_1.eq)(schema_1.serviceProvider.email, parsedValues.data.email)),
    });
    if (existingServiceProvider) {
        throw new ApiError_1.default(400, "Service Provider with this email or phone number already exists");
    }
    const existingOrganization = await db_1.default.query.organization.findFirst({
        where: (0, query_1.eq)(schema_1.organization.id, parsedValues.data.organizationId),
    });
    if (!existingOrganization) {
        throw new ApiError_1.default(404, "Organization not found");
    }
    if (existingOrganization.serviceCategory !== parsedValues.data.serviceType) {
        throw new ApiError_1.default(400, "Service Type does not match with organization service category");
    }
    const hashedPassword = await bcryptjs_1.default.hash(parsedValues.data.password, 10);
    const newServiceProvider = await db_1.default
        .insert(schema_1.serviceProvider)
        .values({ ...parsedValues.data, password: hashedPassword })
        .returning({
        name: schema_1.serviceProvider.name,
        age: schema_1.serviceProvider.age,
        phoneNumber: schema_1.serviceProvider.phoneNumber,
        email: schema_1.serviceProvider.email,
        primaryAddress: schema_1.serviceProvider.primaryAddress,
        serviceType: schema_1.serviceProvider.serviceType,
    });
    if (!newServiceProvider) {
        throw new ApiError_1.default(400, "Failed to register serviceProvider");
    }
    res.status(201).json(new ApiResponse_1.default(201, "serviceProvider registered successfully", {
        serviceProvider: newServiceProvider[0],
    }));
});
exports.registerServiceProvider = registerServiceProvider;
const loginServiceProvider = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsedValues = schema_1.loginServiceProviderSchema.safeParse(req.body);
    if (!parsedValues.success) {
        console.log("Parsing Error: ", parsedValues.error.errors);
        const validationError = new ApiError_1.default(400, "Error validating data", parsedValues.error.errors.map((error) => `${error.path[0]} : ${error.message} `));
        return res.status(400).json(validationError);
    }
    console.log("Login data", parsedValues.data);
    if (!parsedValues.data.phoneNumber) {
        throw new ApiError_1.default(400, "Phone number is required");
    }
    const existingServiceProvider = await db_1.default.query.serviceProvider.findFirst({
        where: (0, query_1.eq)(schema_1.serviceProvider.phoneNumber, parsedValues.data.phoneNumber),
        columns: {
            id: true,
            name: true,
            age: true,
            currentLocation: true,
            phoneNumber: true,
            email: true,
            password: true,
            isVerified: true,
            serviceStatus: true,
            serviceType: true,
            vehicleInformation: true,
            serviceArea: true,
        },
    });
    if (!existingServiceProvider) {
        throw new ApiError_1.default(404, "ServiceProvider not found with given credentials");
    }
    const isPasswordValid = await bcryptjs_1.default.compare(parsedValues.data.password, existingServiceProvider.password);
    if (!isPasswordValid) {
        throw new ApiError_1.default(400, "Invalid Credentials Provided");
    }
    // if (existingServiceProvider && !existingServiceProvider.isVerified) {
    //   const otpToken = await sendOTP(existingServiceProvider.email);
    //   if (!otpToken) {
    //     throw new ApiError(300, "Error Sending OTP token. Please try again");
    //   }
    //   const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    //   const servicePerson = await db
    //     .update(serviceProvider)
    //     .set({
    //       verificationToken: otpToken,
    //       tokenExpiry: tokenExpiry.toISOString(),
    //     })
    //     .where(eq(serviceProvider.id, existingServiceProvider.id));
    //   if (!servicePerson) {
    //     throw new ApiError(400, "Error setting verfication token");
    //   }
    //   return res.status(200).json(
    //     new ApiResponse(200, "OTP sent to serviceProvider for verification", {
    //       serviceProviderId: existingServiceProvider.id,
    //       otpToken,
    //     })
    //   );
    // }
    const token = (0, jwtTokens_1.generateJWT)(existingServiceProvider);
    const loggedInServiceProvider = JSON.parse(JSON.stringify(existingServiceProvider));
    delete loggedInServiceProvider.password;
    res
        .status(200)
        .cookie("token", token)
        .json(new ApiResponse_1.default(200, "ServiceProvider logged in successfully", {
        token,
        serviceProvider: loggedInServiceProvider,
    }));
});
exports.loginServiceProvider = loginServiceProvider;
const logoutServiceProvider = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const loggedInServiceProvider = req.user;
    if (!loggedInServiceProvider || !loggedInServiceProvider.id) {
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const existingServiceProvider = await db_1.default.query.serviceProvider.findFirst({
        where: (0, query_1.eq)(schema_1.serviceProvider.id, loggedInServiceProvider.id),
        columns: {
            id: true,
            name: true,
            phoneNumber: true,
            email: true,
            age: true,
            primaryAddress: true,
        },
    });
    if (!existingServiceProvider) {
        throw new ApiError_1.default(401, "Unauthorized Service Provider");
    }
    res
        .status(200)
        .clearCookie("token")
        .json(new ApiResponse_1.default(200, "Service Provider logged out successfully", {}));
});
exports.logoutServiceProvider = logoutServiceProvider;
const verifyServiceProvider = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { otpToken, serviceProviderId } = req.body;
    if (!otpToken) {
        throw new ApiError_1.default(400, "Please provide OTP");
    }
    if (!serviceProviderId) {
        throw new ApiError_1.default(400, "Please provide serviceProvider ID");
    }
    const existingServiceProvider = await db_1.default.query.serviceProvider.findFirst({
        where: (0, query_1.eq)(schema_1.serviceProvider.id, serviceProviderId),
        columns: {
            password: false,
        },
    });
    if (!existingServiceProvider) {
        throw new ApiError_1.default(400, "ServiceProvider not found");
    }
    if (!existingServiceProvider.verificationToken ||
        !existingServiceProvider.tokenExpiry) {
        throw new ApiError_1.default(400, "Verification token not found");
    }
    if (!existingServiceProvider.tokenExpiry) {
        throw new ApiError_1.default(400, "Verification token expiry not registered. Please verify again.");
    }
    const tokenExpiry = new Date(existingServiceProvider.tokenExpiry);
    const currentTime = new Date(Date.now()).toISOString();
    if (new Date(currentTime) < tokenExpiry) {
        throw new ApiError_1.default(400, "Verification token expired");
    }
    if (otpToken !== existingServiceProvider.verificationToken) {
        throw new ApiError_1.default(400, "Invalid OTP");
    }
    const updatedServiceProvider = await db_1.default
        .update(schema_1.serviceProvider)
        .set({
        isVerified: true,
        verificationToken: null,
        tokenExpiry: null,
    })
        .returning({
        id: schema_1.serviceProvider.id,
        name: schema_1.serviceProvider.name,
        phoneNumber: schema_1.serviceProvider.phoneNumber,
        isVerified: schema_1.serviceProvider.isVerified,
    });
    if (!updatedServiceProvider.length) {
        throw new ApiError_1.default(500, "Failed to verify serviceProvider");
    }
    res.status(200).json(new ApiResponse_1.default(200, "ServiceProvider verified successfully", {
        serviceProvider: updatedServiceProvider[0],
    }));
});
exports.verifyServiceProvider = verifyServiceProvider;
const updateServiceProvider = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const loggedInServiceProvider = req.user;
    if (!loggedInServiceProvider || !loggedInServiceProvider.id) {
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const existingServiceProvider = await db_1.default.query.serviceProvider.findFirst({
        where: (0, query_1.eq)(schema_1.serviceProvider.id, loggedInServiceProvider.id),
    });
    if (!existingServiceProvider) {
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const updateData = req.body;
    if (Object.keys(updateData).length === 0) {
        throw new ApiError_1.default(400, "No data to update");
    }
    const invalidKeys = Object.keys(updateData).filter((key) => !Object.keys(schema_1.serviceProvider).includes(key));
    if (invalidKeys.length > 0) {
        throw new ApiError_1.default(400, `Invalid data to update. Invalid keys: ${invalidKeys}`);
    }
    const updatedServiceProvider = await db_1.default
        .update(schema_1.serviceProvider)
        .set(updateData)
        .where((0, query_1.eq)(schema_1.serviceProvider.id, existingServiceProvider.id))
        .returning({
        id: schema_1.serviceProvider.id,
        name: schema_1.serviceProvider.name,
        phoneNumber: schema_1.serviceProvider.phoneNumber,
        age: schema_1.serviceProvider.age,
        email: schema_1.serviceProvider.email,
        primaryAddress: schema_1.serviceProvider.primaryAddress,
    });
    if (!updatedServiceProvider.length) {
        throw new ApiError_1.default(500, "Failed to update serviceProvider");
    }
    res.status(200).json(new ApiResponse_1.default(200, "ServiceProvider updated successfully", {
        serviceProvider: updatedServiceProvider[0],
    }));
});
exports.updateServiceProvider = updateServiceProvider;
// TODO Implement this method
const deleteServiceProvider = (0, asyncHandler_1.asyncHandler)(async (req, res) => { });
exports.deleteServiceProvider = deleteServiceProvider;
const forgotServiceProviderPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        throw new ApiError_1.default(400, "Please provide phone number");
    }
    const existingServiceProvider = await db_1.default.query.serviceProvider.findFirst({
        where: (0, query_1.eq)(schema_1.serviceProvider.phoneNumber, phoneNumber),
    });
    if (!existingServiceProvider) {
        throw new ApiError_1.default(404, "ServiceProvider not found with given phone number");
    }
    const otpToken = await (0, email_1.sendOTP)(existingServiceProvider.email);
    if (!otpToken) {
        throw new ApiError_1.default(300, "Error Sending OTP token. Please try again");
    }
    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const servicePerson = await db_1.default.update(schema_1.serviceProvider).set({
        resetPasswordToken: otpToken,
        resetPasswordTokenExpiry: tokenExpiry.toISOString(),
    });
    if (!servicePerson) {
        throw new ApiError_1.default(400, "Error setting reset password token");
    }
    res.status(200).json(new ApiResponse_1.default(200, "OTP sent to serviceProvider for verification", {
        serviceProviderId: existingServiceProvider.id,
        otpToken,
    }));
});
exports.forgotServiceProviderPassword = forgotServiceProviderPassword;
const resetServiceProviderPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { otpToken, serviceProviderId, password } = req.body;
    if (!otpToken) {
        throw new ApiError_1.default(400, "Please provide OTP");
    }
    if (!serviceProviderId) {
        throw new ApiError_1.default(400, "Please provide serviceProvider ID");
    }
    if (!password) {
        throw new ApiError_1.default(400, "Please provide password");
    }
    const existingServiceProvider = await db_1.default.query.serviceProvider.findFirst({
        where: (0, query_1.eq)(schema_1.serviceProvider.id, serviceProviderId),
        columns: {
            password: false,
        },
    });
    if (!existingServiceProvider) {
        throw new ApiError_1.default(400, "ServiceProvider not found");
    }
    if (!existingServiceProvider.resetPasswordToken ||
        !existingServiceProvider.resetPasswordTokenExpiry) {
        throw new ApiError_1.default(400, "Reset password token not found");
    }
    if (!existingServiceProvider.resetPasswordTokenExpiry) {
        throw new ApiError_1.default(400, "Reset password token expiry not registered. Please verify again.");
    }
    const tokenExpiry = new Date(existingServiceProvider.resetPasswordTokenExpiry);
    if (Date.now() > tokenExpiry.getTime()) {
        throw new ApiError_1.default(400, "Reset password token expired");
    }
    if (otpToken !== existingServiceProvider.resetPasswordToken) {
        throw new ApiError_1.default(400, "Invalid OTP");
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const updatedServiceProvider = await db_1.default
        .update(schema_1.serviceProvider)
        .set({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
    })
        .returning({
        id: schema_1.serviceProvider.id,
        name: schema_1.serviceProvider.name,
        phoneNumber: schema_1.serviceProvider.phoneNumber,
    });
    if (!updatedServiceProvider.length) {
        throw new ApiError_1.default(500, "Failed to reset password");
    }
    res.status(200).json(new ApiResponse_1.default(200, "Password reset successfully", {
        serviceProvider: updatedServiceProvider[0],
    }));
});
exports.resetServiceProviderPassword = resetServiceProviderPassword;
const getServiceProviderProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const loggedInServiceProvider = req.user;
    if (!loggedInServiceProvider || !loggedInServiceProvider.id) {
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const existingServiceProvider = await db_1.default.query.serviceProvider.findFirst({
        where: (0, query_1.eq)(schema_1.serviceProvider.id, loggedInServiceProvider.id),
    });
    if (!existingServiceProvider) {
        throw new ApiError_1.default(404, "Service Provider not found");
    }
    res.status(200).json(new ApiResponse_1.default(200, "Service Provider found successfully", {
        serviceProvider: existingServiceProvider,
    }));
});
exports.getServiceProviderProfile = getServiceProviderProfile;
const getServiceProvider = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const loggedInServiceProvider = req.user;
    if (!loggedInServiceProvider ||
        !loggedInServiceProvider.id ||
        loggedInServiceProvider.role !== "admin") {
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const existingServiceProvider = await db_1.default.query.serviceProvider.findFirst({
        where: (0, query_1.eq)(schema_1.serviceProvider.id, id),
    });
    if (!existingServiceProvider) {
        throw new ApiError_1.default(404, "Service Provider not found");
    }
    res.status(200).json(new ApiResponse_1.default(200, "Service Provider found successfully", {
        serviceProvider: existingServiceProvider,
    }));
});
exports.getServiceProvider = getServiceProvider;
const updateServiceProviderStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const loggedInUser = req.user;
    const { status, emergencyResponseId } = req.body;
    if (!loggedInUser || !loggedInUser.id) {
        throw new ApiError_1.default(400, "Please login to perform this action");
    }
    if (!status) {
        throw new ApiError_1.default(400, "Status is required");
    }
    // Update service provider status
    const updatedProvider = await db_1.default
        .update(schema_1.serviceProvider)
        .set({
        serviceStatus: status,
    })
        .where((0, query_1.eq)(schema_1.serviceProvider.id, loggedInUser.id))
        .returning();
    (0, socket_1.emitSocketEvent)(req, constants_1.SocketRoom.PROVIDER(updatedProvider[0].id), constants_1.SocketEventEnums.PROVIDER_STATUS_UPDATED, {
        status: updatedProvider[0].serviceStatus,
    });
    if (!updatedProvider || updatedProvider.length === 0) {
        throw new ApiError_1.default(404, "Service provider not found");
    }
    // If there's an emergency response ID and status is "off_duty" or "unavailable"
    if (emergencyResponseId &&
        (status === "off_duty" || status === "unavailable")) {
        // Get the emergency response details
        const emergencyResponseDetails = await db_1.default.query.emergencyResponse.findFirst({
            where: (0, query_1.eq)(schema_1.emergencyResponse.id, emergencyResponseId),
        });
        if (emergencyResponseDetails &&
            emergencyResponseDetails.emergencyRequestId) {
            // Get the emergency request details
            const emergencyRequestDetails = await db_1.default.query.emergencyRequest.findFirst({
                where: (0, query_1.eq)(schema_1.emergencyRequest.id, emergencyResponseDetails.emergencyRequestId),
            });
            if (emergencyRequestDetails && emergencyRequestDetails.location) {
                // Convert location to number type for getBestServiceProvider
                const location = {
                    latitude: parseFloat(emergencyRequestDetails.location.latitude),
                    longitude: parseFloat(emergencyRequestDetails.location.longitude),
                };
                // Find the next best service provider
                const nextBestProvider = await (0, maps_1.getBestServiceProvider)(location, emergencyRequestDetails.serviceType);
                if (nextBestProvider && nextBestProvider.id) {
                    // Update the emergency response with the new provider
                    const updatedResponse = await db_1.default
                        .update(schema_1.emergencyResponse)
                        .set({
                        serviceProviderId: nextBestProvider.id,
                        statusUpdate: "on_route",
                        updateDescription: `Reassigned to ${nextBestProvider.name} due to previous provider being ${status}`,
                    })
                        .where((0, query_1.eq)(schema_1.emergencyResponse.id, emergencyResponseId))
                        .returning();
                    // Update the new provider's status
                    await db_1.default
                        .update(schema_1.serviceProvider)
                        .set({
                        serviceStatus: "assigned",
                    })
                        .where((0, query_1.eq)(schema_1.serviceProvider.id, nextBestProvider.id));
                    // Create notification for the new provider
                    const newNotification = await (0, notification_controller_1.createNotification)({
                        serviceProviderId: nextBestProvider.id,
                        userId: emergencyRequestDetails.userId,
                        message: "New emergency request assigned to you",
                        type: "emergency",
                        deliveryStatus: "unread",
                        source: "system",
                    });
                    // Emit socket events
                    (0, socket_1.emitSocketEvent)(req, constants_1.SocketRoom.PROVIDER(nextBestProvider.id), constants_1.SocketEventEnums.EMERGENCY_RESPONSE_CREATED, {
                        emergencyResponse: updatedResponse,
                    });
                    (0, socket_1.emitSocketEvent)(req, constants_1.SocketRoom.PROVIDER(nextBestProvider.id), constants_1.SocketEventEnums.NOTIFICATION_CREATED, newNotification);
                    // Notify the user about the reassignment
                    (0, socket_1.emitSocketEvent)(req, constants_1.SocketRoom.USER(emergencyRequestDetails.userId), constants_1.SocketEventEnums.EMERGENCY_RESPONSE_CREATED, {
                        emergencyResponse: updatedResponse,
                        message: "Service provider has been reassigned",
                    });
                }
                else {
                    // If no other provider is available, update the emergency request status
                    await db_1.default
                        .update(schema_1.emergencyRequest)
                        .set({
                        requestStatus: "pending",
                    })
                        .where((0, query_1.eq)(schema_1.emergencyRequest.id, emergencyResponseDetails.emergencyRequestId));
                    // Notify the user that no provider is available
                    (0, socket_1.emitSocketEvent)(req, constants_1.SocketRoom.USER(emergencyRequestDetails.userId), constants_1.SocketEventEnums.EMERGENCY_RESPONSE_CREATED, {
                        message: "No service provider is currently available. Please try again later.",
                    });
                }
            }
        }
    }
    res.status(200).json(new ApiResponse_1.default(200, "Service provider status updated", {
        serviceProvider: updatedProvider[0],
    }));
});
exports.updateServiceProviderStatus = updateServiceProviderStatus;
const getNearbyProviders = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { latitude, longitude, serviceType } = req.query;
    if (!latitude || !longitude || !serviceType) {
        throw new ApiError_1.default(400, "latitude, longitude, and serviceType are required");
    }
    // Find all available providers of the requested type
    const providers = await db_1.default.query.serviceProvider.findMany({
        where: (0, query_1.and)((0, query_1.eq)(schema_1.serviceProvider.serviceStatus, "available"), (0, query_1.eq)(schema_1.serviceProvider.serviceType, serviceType)),
        columns: {
            id: true,
            name: true,
            serviceType: true,
            currentLocation: true,
        },
    });
    // Calculate distance and sort
    const userLoc = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
    };
    const withDistance = providers
        .filter((p) => p.currentLocation &&
        p.currentLocation.latitude &&
        p.currentLocation.longitude)
        .map((p) => ({
        ...p,
        distance: (0, distance_1.calculateDistance)(userLoc, {
            latitude: parseFloat(p.currentLocation.latitude),
            longitude: parseFloat(p.currentLocation.longitude),
        }),
    }))
        .sort((a, b) => a.distance - b.distance);
    res.status(200).json({ providers: withDistance });
});
exports.getNearbyProviders = getNearbyProviders;
const changeProviderPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const loggedInProvider = req.user;
    if (!loggedInProvider || !loggedInProvider.id) {
        console.log("Unauthorized");
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        console.log("Please provide old and new password");
        throw new ApiError_1.default(400, "Please provide old and new password");
    }
    if (!loggedInProvider || !loggedInProvider.id) {
        console.log("Unauthorized");
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const existingProvider = await db_1.default.query.serviceProvider.findFirst({
        where: (0, query_1.eq)(schema_1.serviceProvider.id, loggedInProvider.id),
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
    if (!existingProvider) {
        console.log("Unauthorized");
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const isPasswordValid = await bcryptjs_1.default.compare(oldPassword, existingProvider.password);
    if (!isPasswordValid) {
        console.log("Invalid credentials");
        throw new ApiError_1.default(400, "Invalid credentials");
    }
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
    const updatedProvider = await db_1.default
        .update(schema_1.serviceProvider)
        .set({
        password: hashedPassword,
    })
        .where((0, query_1.eq)(schema_1.serviceProvider.id, loggedInProvider.id))
        .returning({
        id: schema_1.serviceProvider.id,
        name: schema_1.serviceProvider.name,
        phoneNumber: schema_1.serviceProvider.phoneNumber,
        email: schema_1.serviceProvider.email,
        age: schema_1.serviceProvider.age,
        primaryAddress: schema_1.serviceProvider.primaryAddress,
        isVerified: schema_1.serviceProvider.isVerified,
    });
    if (!updatedProvider.length) {
        throw new ApiError_1.default(500, "Failed to update user");
    }
    res.status(200).json(new ApiResponse_1.default(200, "Password updated successfully", {
        user: updatedProvider[0],
    }));
});
exports.changeProviderPassword = changeProviderPassword;
