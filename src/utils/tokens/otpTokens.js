"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtpToken = exports.generateOtpToken = void 0;
const authenticator_1 = require("authenticator");
const env_config_1 = require("../../config/env.config");
const generateOtpToken = (phoneNumber) => {
    const formattedKey = phoneNumber + env_config_1.envConfig.otp_secret;
    return (0, authenticator_1.generateToken)(formattedKey);
};
exports.generateOtpToken = generateOtpToken;
const verifyOtpToken = (phoneNumber, otpNumber) => {
    const formattedKey = phoneNumber + env_config_1.envConfig.otp_secret;
    return (0, authenticator_1.verifyToken)(formattedKey, otpNumber);
};
exports.verifyOtpToken = verifyOtpToken;
