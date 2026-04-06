"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRoleAuth = exports.validateServiceProvider = void 0;
const ApiError_1 = __importDefault(require("../utils/api/ApiError"));
const asyncHandler_1 = require("../utils/api/asyncHandler");
const jwtTokens_1 = require("../utils/tokens/jwtTokens");
// Middleware to verify and decode the token
const verifyAndDecodeToken = (token) => {
    if (!token) {
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const decoded = (0, jwtTokens_1.verifyJWT)(token);
    if (!decoded.id) {
        throw new ApiError_1.default(401, "Invalid token");
    }
    return decoded;
};
// Middleware to validate the token
const validateServiceProvider = (0, asyncHandler_1.asyncHandler)(async function validateServiceProvider(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.replace("Bearer ", "");
    const decoded = verifyAndDecodeToken(token);
    req.user = decoded;
    next();
});
exports.validateServiceProvider = validateServiceProvider;
// Middleware to validate the role
const validateRoleAuth = (allowedRoles) => {
    return (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        const token = req.cookies.token || req.headers.authorization?.replace("Bearer ", "");
        const decoded = verifyAndDecodeToken(token);
        if (!allowedRoles.includes(decoded.role)) {
            throw new ApiError_1.default(401, "Not authorized to perform this action");
        }
        req.user = decoded;
        next();
    });
};
exports.validateRoleAuth = validateRoleAuth;
