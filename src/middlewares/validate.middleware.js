"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
const ApiError_1 = __importDefault(require("../utils/api/ApiError"));
/**
 * Validates request payloads and replaces them with parsed values.
 */
function validateRequest(schema, source = "body") {
    return (req, _res, next) => {
        const parsed = schema.safeParse(req[source]);
        if (!parsed.success) {
            return next(new ApiError_1.default(400, "Validation failed", parsed.error.errors.map((issue) => `${issue.path.join(".") || source}: ${issue.message}`)));
        }
        req[source] = parsed.data;
        return next();
    };
}
