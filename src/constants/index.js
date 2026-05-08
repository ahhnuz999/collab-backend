"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketRoom = exports.SocketEventEnums = exports.getOtpMessage = void 0;
const getOtpMessage = (otpCode) => {
    return `Welcome to firstResQ. Your Login OTP Code is ${otpCode}`;
};
exports.getOtpMessage = getOtpMessage;
var SocketEventEnums;
(function (SocketEventEnums) {
    SocketEventEnums["CONNECTION_EVENT"] = "connection";
    SocketEventEnums["DISCONNECT_EVENT"] = "disconnect";
    SocketEventEnums["AUTHORIZED_EVENT"] = "authorized";
    SocketEventEnums["JOIN_EMERGENCY_ROOM"] = "joinEmergencyRoom";
    SocketEventEnums["LEAVE_EMERGENCY_ROOM"] = "leaveEmergencyRoom";
    SocketEventEnums["EMERGENCY_RESPONSE_CREATED"] = "emergencyResponseCreated";
    SocketEventEnums["NOTIFICATION_CREATED"] = "notificationCreated";
    SocketEventEnums["EMERGENCY_RESPONSE_STATUS_UPDATED"] = "emergencyResponseStatusUpdated";
    SocketEventEnums["UPDATE_LOCATION"] = "updateLocation";
    SocketEventEnums["UPDATE_USER_LOCATION"] = "updateUserLocation";
    SocketEventEnums["SEND_LOCATION"] = "sendLocation";
    SocketEventEnums["SEND_USER_LOCATION"] = "sendUserLocation";
    SocketEventEnums["PROVIDER_FOUND"] = "providerFound";
    SocketEventEnums["NEED_LOCATION"] = "needLocation";
    SocketEventEnums["REQUEST_EMERGENCY_SERVICE"] = "requestEmergencyService";
    SocketEventEnums["UPDATE_PROVIDER_STATUS"] = "updateProviderStatus";
    SocketEventEnums["PROVIDER_STATUS_UPDATED"] = "providerStatusUpdated";
    SocketEventEnums["SEND_SOS"] = "sendSOS";
    SocketEventEnums["LOCATION_UPDATE"] = "locationUpdate";
    SocketEventEnums["RECEIVE_ALERT"] = "receiveAlert";
    SocketEventEnums["SOCKET_ERROR"] = "socketError";
})(SocketEventEnums || (exports.SocketEventEnums = SocketEventEnums = {}));
exports.SocketRoom = {
    USER: (id) => `user:${id}`,
    PROVIDER: (id) => `provider:${id}`,
    EMERGENCY: (id) => `emergency:${id}`,
};
