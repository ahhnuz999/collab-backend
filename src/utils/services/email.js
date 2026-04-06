"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTP = exports.sendOTPEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const mailgen_1 = __importDefault(require("mailgen"));
const env_config_1 = require("../../config/env.config");
const otpTokens_1 = require("../tokens/otpTokens");
const mailGenerator = new mailgen_1.default({
    theme: "default",
    product: {
        name: "emerG",
        link: "https://firstresq.com",
        logo: "https://firstresq.com/logo.png",
    },
});
const sendOTPEmail = async (email, otpToken) => {
    try {
        const emailContent = {
            body: {
                name: "User",
                intro: "Welcome to emerG !",
                action: {
                    instructions: "To complete your verification, please use the following OTP code:",
                    button: {
                        color: "#EB1A3D",
                        text: otpToken,
                        link: "#",
                    },
                },
                outro: "This OTP will expire in 10 minutes. If you did not request this, please ignore this email.",
            },
        };
        const emailBody = mailGenerator.generate(emailContent);
        const emailText = mailGenerator.generatePlaintext(emailContent);
        const transportOptions = {
            service: "gmail",
            pool: true,
            auth: {
                user: env_config_1.envConfig.google_mail,
                pass: env_config_1.envConfig.google_pass,
            },
        };
        const transporter = nodemailer_1.default.createTransport(transportOptions);
        const info = await transporter.sendMail({
            from: env_config_1.envConfig.google_mail,
            to: email,
            subject: "Your emerG Verification OTP",
            html: emailBody,
            text: emailText,
        });
        console.log("Email sent:", info.messageId, info);
        return true;
    }
    catch (error) {
        console.log("Error sending email:", error);
        return false;
    }
};
exports.sendOTPEmail = sendOTPEmail;
const sendOTP = async (email) => {
    const otpToken = (0, otpTokens_1.generateOtpToken)(email);
    try {
        const emailSent = await (0, exports.sendOTPEmail)(email, otpToken);
        if (!emailSent) {
            throw new Error("Error sending OTP email");
        }
        console.log("Sending OTP Successful", otpToken);
        return otpToken;
    }
    catch (error) {
        console.log("Error Sending OTP", error);
        throw new Error("Error Sending OTP. Please try again later");
    }
};
exports.sendOTP = sendOTP;
