"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = sendPushNotification;
exports.sendSmsFallback = sendSmsFallback;
exports.deliverNotification = deliverNotification;
exports.notifyEmergencyNetwork = notifyEmergencyNetwork;
const axios_1 = __importDefault(require("axios"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = require("../config/env.config");
const models_1 = require("../db/models");
const twilio_1 = __importDefault(require("../utils/services/twilio"));
let accessTokenCache = null;
/**
 * Creates a Google OAuth access token for Firebase Cloud Messaging.
 */
async function getFcmAccessToken() {
    if (!env_config_1.envConfig.fcm_project_id ||
        !env_config_1.envConfig.fcm_client_email ||
        !env_config_1.envConfig.fcm_private_key) {
        return null;
    }
    if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 60_000) {
        return accessTokenCache.token;
    }
    const now = Math.floor(Date.now() / 1000);
    const assertion = jsonwebtoken_1.default.sign({
        iss: env_config_1.envConfig.fcm_client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
    }, env_config_1.envConfig.fcm_private_key.replace(/\\n/g, "\n"), { algorithm: "RS256" });
    const body = new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
    });
    const response = await axios_1.default.post("https://oauth2.googleapis.com/token", body.toString(), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
    accessTokenCache = {
        token: response.data.access_token,
        expiresAt: Date.now() + Number(response.data.expires_in || 3600) * 1000,
    };
    return accessTokenCache.token;
}
/**
 * Sends a push notification using Firebase Cloud Messaging when credentials are configured.
 */
async function sendPushNotification(pushToken, title, message, data = {}) {
    const accessToken = await getFcmAccessToken();
    if (!accessToken || !pushToken) {
        return false;
    }
    await axios_1.default.post(`https://fcm.googleapis.com/v1/projects/${env_config_1.envConfig.fcm_project_id}/messages:send`, {
        message: {
            token: pushToken,
            notification: {
                title,
                body: message,
            },
            data: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)])),
        },
    }, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    return true;
}
/**
 * Sends an SMS fallback when Twilio is configured.
 */
async function sendSmsFallback(phoneNumber, message) {
    if (!env_config_1.envConfig.twilio_account_sid ||
        !env_config_1.envConfig.twilio_auth_token ||
        !env_config_1.envConfig.twilio_from_number ||
        !phoneNumber) {
        return false;
    }
    await twilio_1.default.messages.create({
        to: phoneNumber,
        from: env_config_1.envConfig.twilio_from_number,
        body: message,
    });
    return true;
}
/**
 * Persists and fan-outs a notification with push and SMS fallbacks.
 */
async function deliverNotification(target) {
    const notification = (await models_1.NotificationModel.create({
        userId: target.userId,
        serviceProviderId: target.serviceProviderId,
        message: target.message,
        type: target.type,
        source: target.source,
        priority: target.priority || "high",
        metadata: target.metadata || {},
        deliveryStatus: "pending",
        isRead: false,
        doNotDisturb: false,
    }));
    let delivered = false;
    try {
        if (target.pushToken) {
            delivered = await sendPushNotification(target.pushToken, target.title, target.message, target.metadata || {});
        }
    }
    catch (error) {
        console.log("Push notification failed:", error);
    }
    try {
        if (!delivered && target.phoneNumber) {
            delivered = await sendSmsFallback(target.phoneNumber, target.message);
        }
    }
    catch (error) {
        console.log("SMS fallback failed:", error);
    }
    notification.deliveryStatus = delivered ? "delivered" : "pending";
    await notification.save();
    return notification.toObject();
}
/**
 * Notifies a user's saved emergency contacts and nearby responders about a new SOS.
 */
async function notifyEmergencyNetwork(userId, context, responderIds) {
    const [requester, contacts, responders] = (await Promise.all([
        models_1.UserModel.findOne({ id: userId }).lean(),
        models_1.EmergencyContactModel.find({ userId }).lean(),
        models_1.ServiceProviderModel.find({ id: { $in: responderIds } }).lean(),
    ]));
    const requesterName = requester?.name || context.requesterName;
    const commonMessage = `${requesterName} triggered a ${context.emergencyType} SOS at ${context.location.latitude}, ${context.location.longitude}.`;
    for (const contact of contacts) {
        await deliverNotification({
            userId,
            title: "Emergency SOS",
            message: commonMessage,
            type: "emergency_contact_alert",
            source: "sos",
            phoneNumber: contact.phoneNumber,
            metadata: {
                emergencyId: context.emergencyId,
                relationship: contact.relationship,
            },
            priority: "high",
        });
    }
    for (const responder of responders) {
        await deliverNotification({
            serviceProviderId: responder.id,
            title: "Nearby Emergency",
            message: commonMessage,
            type: "responder_alert",
            source: "sos",
            phoneNumber: String(responder.phoneNumber || ""),
            pushToken: responder.pushToken,
            metadata: {
                emergencyId: context.emergencyId,
                emergencyType: context.emergencyType,
            },
            priority: "high",
        });
    }
}
