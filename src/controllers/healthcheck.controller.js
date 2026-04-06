"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = void 0;
const ApiResponse_1 = __importDefault(require("../utils/api/ApiResponse"));
const asyncHandler_1 = require("../utils/api/asyncHandler");
const healthCheck = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.status(200).json(new ApiResponse_1.default(200, "Server is up and running", {}));
});
exports.healthCheck = healthCheck;
