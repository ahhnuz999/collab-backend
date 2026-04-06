"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
function asyncHandler(fnc) {
    return async function (req, res, next) {
        try {
            await fnc(req, res, next);
        }
        catch (error) {
            next(error);
        }
    };
}
