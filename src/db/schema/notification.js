"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationSchema = exports.notifications = exports.priorityEnum = exports.priorityValues = void 0;
const zod_1 = require("zod");
const models_1 = require("../../db/models");
const helpers_1 = require("./helpers");
exports.priorityValues = ["low", "medium", "high"];
exports.priorityEnum = {
    enumValues: exports.priorityValues,
    schema: zod_1.z.enum(exports.priorityValues),
};
exports.notifications = (0, helpers_1.createTable)("notifications", models_1.NotificationModel, [
    "id",
    "userId",
    "serviceProviderId",
    "message",
    "type",
    "priority",
    "source",
    "metadata",
    "deliveryStatus",
    "isRead",
    "doNotDisturb",
    "createdAt",
    "updatedAt",
]);
exports.notificationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string().nullish(),
    serviceProviderId: zod_1.z.string().nullish(),
    message: zod_1.z.string(),
    type: zod_1.z.string(),
    priority: zod_1.z.enum(exports.priorityValues).optional(),
    source: zod_1.z.string(),
    metadata: zod_1.z.any().optional(),
    deliveryStatus: zod_1.z.string().optional(),
    isRead: zod_1.z.boolean().optional(),
    doNotDisturb: zod_1.z.boolean().optional(),
    createdAt: zod_1.z.coerce.date().optional(),
    updatedAt: zod_1.z.coerce.date().optional(),
});
