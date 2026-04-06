"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.appModels = exports.NotificationModel = exports.FeedbackModel = exports.EmergencyContactModel = exports.EmergencyResponseModel = exports.EmergencyRequestModel = exports.ServiceProviderModel = exports.OrganizationModel = exports.UserModel = void 0;
const crypto_1 = require("crypto");
const mongoose_1 = __importStar(require("mongoose"));
const locationSchema = new mongoose_1.Schema({
    latitude: { type: String, default: "" },
    longitude: { type: String, default: "" },
}, { _id: false });
const medicalInfoSchema = new mongoose_1.Schema({
    bloodGroup: { type: String, default: "" },
    allergies: { type: [String], default: [] },
    conditions: { type: [String], default: [] },
    medications: { type: [String], default: [] },
    notes: { type: String, default: "" },
}, { _id: false });
const vehicleInformationSchema = new mongoose_1.Schema({
    type: { type: String, default: "Not filled" },
    number: { type: String, default: "Not filled" },
    model: { type: String, default: "Not filled" },
    color: { type: String, default: "Not filled" },
}, { _id: false });
const baseOptions = {
    timestamps: true,
    versionKey: false,
};
function withBaseFields(definition) {
    return {
        id: {
            type: String,
            default: crypto_1.randomUUID,
            unique: true,
            index: true,
        },
        ...definition,
    };
}
exports.UserModel = mongoose_1.default.model("User", new mongoose_1.Schema(withBaseFields({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    phoneNumber: { type: Number, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    primaryAddress: { type: String, required: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    profilePicture: String,
    verificationToken: String,
    tokenExpiry: Date,
    currentLocation: { type: locationSchema, default: () => ({}) },
    medicalInfo: { type: medicalInfoSchema, default: () => ({}) },
    resetPasswordToken: String,
    resetPasswordTokenExpiry: Date,
    pushToken: String,
}), baseOptions));
exports.OrganizationModel = mongoose_1.default.model("Organization", new mongoose_1.Schema(withBaseFields({
    name: { type: String, required: true, unique: true },
    serviceCategory: {
        type: String,
        enum: ["ambulance", "police", "rescue_team", "fire_truck"],
        required: true,
    },
    generalNumber: { type: Number, required: true },
    status: {
        type: String,
        enum: ["not_active", "active", "not_verified"],
        default: "not_verified",
    },
}), baseOptions));
exports.ServiceProviderModel = mongoose_1.default.model("ServiceProvider", new mongoose_1.Schema(withBaseFields({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: Number, required: true, unique: true },
    primaryAddress: { type: String, required: true },
    serviceArea: { type: String, default: "Kathmandu Valley" },
    password: { type: String, required: true },
    serviceType: {
        type: String,
        enum: ["ambulance", "police", "rescue_team", "fire_truck"],
        required: true,
    },
    isVerified: { type: Boolean, default: false },
    profilePicture: String,
    organizationId: { type: String, required: true, index: true },
    currentLocation: { type: locationSchema, default: () => ({}) },
    vehicleInformation: {
        type: vehicleInformationSchema,
        default: () => ({}),
    },
    serviceStatus: {
        type: String,
        enum: ["available", "assigned", "off_duty"],
        default: "available",
    },
    verificationToken: String,
    tokenExpiry: Date,
    resetPasswordToken: String,
    resetPasswordTokenExpiry: Date,
    pushToken: String,
}), baseOptions));
exports.EmergencyRequestModel = mongoose_1.default.model("EmergencyRequest", new mongoose_1.Schema(withBaseFields({
    userId: { type: String, required: true, index: true },
    serviceType: {
        type: String,
        enum: ["ambulance", "police", "rescue_team", "fire_truck"],
        required: true,
    },
    requestStatus: {
        type: String,
        enum: ["pending", "assigned", "rejected", "in_progress", "completed"],
        default: "pending",
    },
    requestTime: { type: Date, default: Date.now },
    dispatchTime: Date,
    arrivalTime: Date,
    description: String,
    location: { type: locationSchema, required: true },
}), baseOptions));
exports.EmergencyResponseModel = mongoose_1.default.model("EmergencyResponse", new mongoose_1.Schema(withBaseFields({
    emergencyRequestId: { type: String, index: true },
    serviceProviderId: { type: String, index: true },
    statusUpdate: {
        type: String,
        enum: ["accepted", "arrived", "on_route", "rejected"],
        default: "accepted",
    },
    originLocation: { type: locationSchema, required: true },
    destinationLocation: { type: locationSchema, required: true },
    assignedAt: Date,
    respondedAt: { type: Date, default: Date.now },
    updateDescription: String,
}), baseOptions));
exports.EmergencyContactModel = mongoose_1.default.model("EmergencyContact", new mongoose_1.Schema(withBaseFields({
    name: { type: String, required: true },
    isCommanContact: { type: Boolean, default: false },
    relationship: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    userId: { type: String, index: true },
}), baseOptions));
exports.FeedbackModel = mongoose_1.default.model("Feedback", new mongoose_1.Schema(withBaseFields({
    userId: { type: String, required: true, index: true },
    serviceProviderId: { type: String, required: true, index: true },
    message: String,
    serviceRatings: Number,
}), baseOptions));
exports.NotificationModel = mongoose_1.default.model("Notification", new mongoose_1.Schema(withBaseFields({
    userId: { type: String, index: true },
    serviceProviderId: { type: String, index: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "low",
    },
    source: { type: String, required: true },
    metadata: mongoose_1.Schema.Types.Mixed,
    deliveryStatus: { type: String, default: "pending" },
    isRead: { type: Boolean, default: false },
    doNotDisturb: { type: Boolean, default: false },
}), baseOptions));
exports.appModels = [
    exports.UserModel,
    exports.EmergencyContactModel,
    exports.EmergencyRequestModel,
    exports.EmergencyResponseModel,
    exports.FeedbackModel,
    exports.NotificationModel,
    exports.OrganizationModel,
    exports.ServiceProviderModel,
];
