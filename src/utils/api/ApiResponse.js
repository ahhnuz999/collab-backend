"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ApiResponse {
    statusCode;
    message;
    data;
    success;
    constructor(statusCode, message = "success", data) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode < 400;
    }
}
exports.default = ApiResponse;
