"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimiter = createRateLimiter;
const ApiError_1 = __importDefault(require("../utils/api/ApiError"));
const store = new Map();
/**
 * Creates a lightweight in-memory rate limiter suitable for a single-node deployment.
 */
function createRateLimiter(options) {
    return (req, _res, next) => {
        const key = `${req.ip}:${req.baseUrl}${req.path}`;
        const now = Date.now();
        const current = store.get(key);
        if (!current || current.resetAt <= now) {
            store.set(key, {
                count: 1,
                resetAt: now + options.windowMs,
            });
            return next();
        }
        if (current.count >= options.limit) {
            return next(new ApiError_1.default(429, "Too many requests. Please wait a moment before trying again."));
        }
        current.count += 1;
        store.set(key, current);
        return next();
    };
}
