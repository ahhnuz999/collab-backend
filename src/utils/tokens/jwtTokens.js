"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = exports.generateJWT = void 0;
const env_config_1 = require("../../config/env.config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateJWT = (user) => {
    if (!env_config_1.envConfig.jwt_secret) {
        throw new Error("JWT secret not found in environment variables");
    }
    const token = jsonwebtoken_1.default.sign({
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role ? user.role : "service_provider",
    }, env_config_1.envConfig.jwt_secret, {
        expiresIn: env_config_1.envConfig.jwt_expiry,
    });
    return token;
};
exports.generateJWT = generateJWT;
const verifyJWT = (token) => {
    if (!env_config_1.envConfig.jwt_secret) {
        throw new Error("JWT secret not found in environment variables");
    }
    const decoded = jsonwebtoken_1.default.verify(token, env_config_1.envConfig.jwt_secret);
    return decoded;
};
exports.verifyJWT = verifyJWT;
