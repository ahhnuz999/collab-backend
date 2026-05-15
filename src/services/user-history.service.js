"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLocationName = exports.getUserRequestHistory = exports.recordUserRequestHistory = void 0;
const models_1 = require("../db/models");
const axios_1 = require("axios");

function buildHistoryEvent(status, message) {
    return {
        status,
        message,
        at: new Date(),
    };
}

async function recordUserRequestHistory(request, message = "Emergency request created") {
    if (!request?.id || !request?.userId) {
        return null;
    }
    const status = request.requestStatus || request.status || "pending";
    const update = {
        userId: request.userId,
        emergencyRequestId: request.id,
        serviceType: request.serviceType || request.emergencyType,
        requestStatus: status,
        requestTime: request.requestTime || new Date(),
        dispatchTime: request.dispatchTime || null,
        arrivalTime: request.arrivalTime || null,
        description: request.description || request.emergencyDescription || "",
        location: request.location || request.emergencyLocation || request.currentLocation || {
            latitude: "",
            longitude: "",
        },
        locationName: request.locationName || "",
        lastEventAt: new Date(),
    };
    return models_1.UserRequestHistoryModel.findOneAndUpdate({ emergencyRequestId: request.id }, {
        $set: update,
        $push: {
            events: buildHistoryEvent(status, message),
        },
    }, { new: true, upsert: true }).lean();
}
exports.recordUserRequestHistory = recordUserRequestHistory;

async function getUserRequestHistory(userId, limit = 10) {
    return models_1.UserRequestHistoryModel.find({ userId })
        .sort({ requestTime: -1, createdAt: -1 })
        .limit(limit)
        .lean();
}
exports.getUserRequestHistory = getUserRequestHistory;

function pickLocationName(value) {
    if (!value) {
        return "";
    }
    if (typeof value === "string") {
        return value;
    }
    const record = value;
    return (record.name ||
        record.address ||
        record.formattedAddress ||
        record.formatted_address ||
        record.placeName ||
        record.place_name ||
        record.ward ||
        record.municipality ||
        "");
}

async function resolveLocationName(location) {
    if (!location?.latitude || !location.longitude) {
        return "";
    }
    try {
        const response = await axios_1.get("https://nominatim.openstreetmap.org/reverse", {
            params: {
                format: "jsonv2",
                lat: location.latitude,
                lon: location.longitude,
                zoom: 18,
                addressdetails: 1,
            },
            headers: {
                "User-Agent": "EmerGCollegeProject/1.0",
                Accept: "application/json",
            },
            timeout: 5000,
        });
        const result = response.data;
        return (result?.name ||
            result?.address?.neighbourhood ||
            result?.address?.suburb ||
            result?.address?.city_district ||
            result?.address?.road ||
            result?.display_name ||
            "");
    }
    catch {
        return "";
    }
}
exports.resolveLocationName = resolveLocationName;
