"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ApiError extends Error {
    statusCode;
    data;
    errors;
    constructor(statusCode, message = "Internal Server Error", errors = [], data = null, stack = "") {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.errors = errors;
        if (this.stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    toJSON() {
        return {
            message: this.message,
            errors: this.errors,
            data: this.data,
            statusCode: this.statusCode,
        };
    }
}
exports.default = ApiError;
