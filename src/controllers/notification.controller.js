"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokens = exports.storePushToken = exports.markAsRead = exports.createNotification = exports.getNotifications = void 0;
const asyncHandler_1 = require("../utils/api/asyncHandler");
const notification_1 = require("../db/schema/notification");
const db_1 = __importDefault(require("../db"));
const query_1 = require("../db/query");
const ApiResponse_1 = __importDefault(require("../utils/api/ApiResponse"));
const socket_1 = require("../socket");
const constants_1 = require("../constants");
const expo_server_sdk_1 = require("expo-server-sdk");
const ApiError_1 = __importDefault(require("../utils/api/ApiError"));
// Initialize Expo client
const expo = new expo_server_sdk_1.Expo();
const userPushTokens = {};
const connectedUsers = new Set();
const connectedProviders = new Set();
const parseBooleanValue = (value) => {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true") {
            return true;
        }
        if (normalized === "false") {
            return false;
        }
    }
    return undefined;
};
const parseDateValue = (value) => {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === "string" && value.trim()) {
        const parsedDate = new Date(value);
        if (!Number.isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString();
        }
    }
    return undefined;
};
const storePushToken = async (userId, token) => {
    if (!expo_server_sdk_1.Expo.isExpoPushToken(token)) {
        throw new Error(`Push token ${token} is not a valid Expo push token`);
    }
    userPushTokens[userId] = token;
};
exports.storePushToken = storePushToken;
const getNotifications = (0, asyncHandler_1.asyncHandler)(async (req, res, _next) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new ApiError_1.default(401, "Unauthorized");
    }
    const payload = req.method === "GET"
        ? req.query
        : (req.body ?? {});
    const isReadValue = parseBooleanValue(payload.isRead) ??
        parseBooleanValue(payload.markAsRead);
    const fromDate = parseDateValue(payload.fromDaysAgo);
    const toDate = parseDateValue(payload.toDaysAgo);
    const notificationFilters = [(0, query_1.eq)(notification_1.notifications.userId, userId)];
    if (typeof isReadValue === "boolean") {
        notificationFilters.push((0, query_1.eq)(notification_1.notifications.isRead, isReadValue));
    }
    if (fromDate) {
        notificationFilters.push((0, query_1.gte)(notification_1.notifications.createdAt, fromDate));
    }
    if (toDate) {
        notificationFilters.push((0, query_1.lte)(notification_1.notifications.createdAt, toDate));
    }
    const foundNotifications = await db_1.default.query.notifications.findMany({
        where: (0, query_1.and)(...notificationFilters),
    });
    if (!foundNotifications) {
        return res
            .status(404)
            .json(new ApiResponse_1.default(404, "No notifications found", {}));
    }
    return res
        .status(200)
        .json(new ApiResponse_1.default(200, "Notifications found", foundNotifications));
});
exports.getNotifications = getNotifications;
const createNotification = async (data, req) => {
    try {
        if (!data.message || !data.type || !data.source || !data.userId) {
            throw new Error("Missing required fields");
        }
        const inserted = await db_1.default
            .insert(notification_1.notifications)
            .values({
            message: data.message,
            type: data.type,
            source: data.source,
            userId: data.userId,
            serviceProviderId: data.serviceProviderId,
            priority: data.priority || "low",
            metadata: data.metadata,
            deliveryStatus: "pending",
            isRead: false,
            doNotDisturb: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })
            .returning();
        const token = userPushTokens[data.userId];
        const isConnected = connectedUsers.has(data.userId) ||
            (data.serviceProviderId &&
                connectedProviders.has(data.serviceProviderId));
        // Push only if offline or background
        if (!isConnected && token && expo_server_sdk_1.Expo.isExpoPushToken(token)) {
            const messages = [
                {
                    to: token,
                    sound: "default",
                    title: `New ${data.type}`,
                    body: data.message,
                    data: { notificationId: inserted[0].id },
                },
            ];
            try {
                const chunks = expo.chunkPushNotifications(messages);
                const tickets = [];
                for (const chunk of chunks) {
                    try {
                        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                        tickets.push(...ticketChunk);
                    }
                    catch (error) {
                        console.log("Error sending push notification chunk:", error);
                    }
                }
                // Update notification status if push was successful
                if (tickets.length > 0) {
                    await db_1.default
                        .update(notification_1.notifications)
                        .set({ deliveryStatus: "delivered" })
                        .where((0, query_1.eq)(notification_1.notifications.id, inserted[0].id));
                }
            }
            catch (error) {
                console.log("Error sending push notification:", error);
            }
        }
        // Emit socket event for real-time notification
        if (req) {
            const room = data.serviceProviderId != null
                ? constants_1.SocketRoom.PROVIDER(data.serviceProviderId)
                : constants_1.SocketRoom.USER(data.userId);
            (0, socket_1.emitSocketEvent)(req, room, constants_1.SocketEventEnums.NOTIFICATION_CREATED, inserted[0]);
        }
        return inserted[0];
    }
    catch (error) {
        console.log("Error in createNotification:", error);
        throw new Error("Notification creation failed");
    }
};
exports.createNotification = createNotification;
const markAsRead = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updatedNotification = await db_1.default
        .update(notification_1.notifications)
        .set({
        isRead: true,
        deliveryStatus: "delivered",
        updatedAt: new Date().toISOString(),
    })
        .where((0, query_1.eq)(notification_1.notifications.id, id))
        .returning();
    if (!updatedNotification) {
        throw new Error("Error updating notification");
    }
    return res
        .status(200)
        .json(new ApiResponse_1.default(200, "Notification updated", updatedNotification[0]));
});
exports.markAsRead = markAsRead;
const getTokens = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { token } = req.body;
    const userId = req.user.id;
    if (!userId) {
        throw new ApiError_1.default(401, "Not authorized");
    }
    await storePushToken(userId, token);
    return res.status(200).json({
        success: true,
        message: "Push token stored successfully",
    });
});
exports.getTokens = getTokens;
