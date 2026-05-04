"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const env_config_1 = require("../config/env.config");
/**
 * Handles unknown routes using a consistent API error shape.
 */
function notFoundHandler(req, res, _next) {
    return res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        errors: [],
    });
}
/**
 * Converts thrown application errors into stable JSON responses.
 */
function errorHandler(error, _req, res, _next) {
    if (error instanceof zod_1.ZodError) {
        const issues = error.issues;
        const message = issues
            .map((i) => `${i.path.length ? `${i.path.join(".")}: ` : ""}${i.message}`)
            .join("; ");
        return res.status(400).json({
            success: false,
            message,
            errors: issues,
            data: null,
            stack: env_config_1.envConfig.node_env === "development" ? error?.stack : undefined,
        });
    }
    const statusCode = error?.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        message: error?.message || "Internal server error",
        errors: error?.errors || [],
        data: error?.data || null,
        stack: env_config_1.envConfig.node_env === "development" ? error?.stack : undefined,
    });
}
