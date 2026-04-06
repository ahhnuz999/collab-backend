"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackSchema = exports.feedback = void 0;
const zod_1 = require("zod");
const models_1 = require("../../db/models");
const helpers_1 = require("./helpers");
exports.feedback = (0, helpers_1.createTable)("feedback", models_1.FeedbackModel, [
    "id",
    "userId",
    "serviceProviderId",
    "message",
    "serviceRatings",
    "createdAt",
    "updatedAt",
]);
exports.feedbackSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    serviceProviderId: zod_1.z.string(),
    message: zod_1.z.string().nullish(),
    serviceRatings: zod_1.z.number().nullish(),
    createdAt: zod_1.z.coerce.date().optional(),
    updatedAt: zod_1.z.coerce.date().optional(),
});
