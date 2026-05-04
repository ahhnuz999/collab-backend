"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitSocketEvent = exports.initializeSocketIo = void 0;
const schema_1 = require("../db/schema");
const cookie_1 = require("cookie");
const jwtTokens_1 = require("../utils/tokens/jwtTokens");
const db_1 = __importDefault(require("../db"));
const query_1 = require("../db/query");
const constants_1 = require("../constants");
const ApiError_1 = __importDefault(require("../utils/api/ApiError"));
const distance_1 = require("../utils/distance");
const enums_1 = require("../db/schema/enums");
const mountJoinRoomEvent = (socket) => {
    socket.on(constants_1.SocketEventEnums.JOIN_EMERGENCY_ROOM, ({ emergencyResponseId, userId, providerId, }) => {
        const room = constants_1.SocketRoom.EMERGENCY(emergencyResponseId);
        socket.join(room);
        console.log(`[SOCKET] ${socket.id} joined room emergency:${emergencyResponseId}`);
    });
};
const mountSendLocationEvent = (socket) => {
    socket.on(constants_1.SocketEventEnums.SEND_LOCATION, async ({ emergencyResponseId, location }) => {
        try {
            if (!socket.user?.id) {
                console.log("No user ID found in socket");
                return;
            }
            if (!location || !location.latitude || !location.longitude) {
                console.log("Invalid location data");
                return;
            }
            // Convert location to string format for database
            const locationString = {
                latitude: location.latitude.toString(),
                longitude: location.longitude.toString(),
            };
            console.log("[DEBUG] Updating provider location:", {
                providerId: socket.user.id,
                location: locationString,
            });
            // Update provider's location in database
            // const updated = await db
            //   .update(serviceProvider)
            //   .set({ currentLocation: locationString })
            //   .where(eq(serviceProvider.id, socket.user?.id))
            //   .returning({
            //     id: serviceProvider.id,
            //     name: serviceProvider.name,
            //     currentLocation: serviceProvider.currentLocation,
            //     serviceStatus: serviceProvider.serviceStatus,
            //   });
            // if (updated.length === 0) {
            //   console.log("Failed to update provider location");
            //   return;
            // }
            // console.log(
            //   "[DEBUG] Provider location updated successfully:",
            //   updated[0]
            // );
            // Broadcast location update to all users in the emergency room
            socket
                .to(constants_1.SocketRoom.EMERGENCY(emergencyResponseId))
                .emit(constants_1.SocketEventEnums.UPDATE_LOCATION, {
                providerId: socket.user?.id,
                location: locationString,
                timestamp: new Date().toISOString(),
            });
            console.log(`[SOCKET] Location sent from ${socket.user?.id}`);
        }
        catch (error) {
            console.log("[SOCKET] Error in location update:", error);
            socket.emit(constants_1.SocketEventEnums.SOCKET_ERROR, {
                message: "Failed to update location",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });
};
const mountUserLocationEvent = (socket) => {
    socket.on(constants_1.SocketEventEnums.SEND_USER_LOCATION, async ({ emergencyResponseId, location }) => {
        try {
            console.log("USER IN SOCKET", socket.user);
            if (!socket.user?.id) {
                console.log("No user ID found in socket");
                return;
            }
            if (!location || !location.latitude || !location.longitude) {
                console.log("Invalid user location data");
                return;
            }
            // Convert location to string format for database
            const locationString = {
                latitude: location.latitude,
                longitude: location.longitude,
            };
            console.log("location Update", locationString);
            // Update user's location in database
            if (socket.user.id) {
                const updated = await db_1.default
                    .update(schema_1.user)
                    .set({ currentLocation: locationString })
                    .where((0, query_1.eq)(schema_1.user.id, socket.user?.id))
                    .returning({
                    id: schema_1.user.id,
                    currentLocation: schema_1.user.currentLocation,
                });
                if (updated.length === 0) {
                    console.log("Failed to update user location");
                    return;
                }
            }
            // Broadcast location update to all providers in the emergency room
            socket
                .to(constants_1.SocketRoom.EMERGENCY(emergencyResponseId))
                .emit(constants_1.SocketEventEnums.UPDATE_USER_LOCATION, {
                userId: socket.user?.id,
                location: locationString,
                timestamp: new Date().toISOString(),
            });
            socket
                .to(constants_1.SocketRoom.EMERGENCY(emergencyResponseId))
                .emit(constants_1.SocketEventEnums.LOCATION_UPDATE, {
                userId: socket.user?.id,
                location: locationString,
                timestamp: new Date().toISOString(),
            });
            console.log(`[SOCKET] User location sent from ${socket.user?.id}`);
        }
        catch (error) {
            console.log("[SOCKET] Error in user location update:", error);
            socket.emit(constants_1.SocketEventEnums.SOCKET_ERROR, {
                message: "Failed to update user location",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });
};
const mountProviderFoundEvent = (socket) => {
    socket.on(constants_1.SocketEventEnums.PROVIDER_FOUND, ({ emergencyResponseId }) => {
        // Emit needLocation event to all providers in the emergency room
        socket
            .to(constants_1.SocketRoom.EMERGENCY(emergencyResponseId))
            .emit(constants_1.SocketEventEnums.NEED_LOCATION, {
            emergencyResponseId,
        });
        console.log(`[SOCKET] Need location event emitted for emergency: ${emergencyResponseId}`);
    });
};
const mountRequestEmergencyServiceEvent = (socket) => {
    socket.on(constants_1.SocketEventEnums.REQUEST_EMERGENCY_SERVICE, async ({ serviceType, userLocation, }) => {
        try {
            if (!socket.user?.id) {
                console.log("No user ID found in socket");
                return;
            }
            // Get all available service providers of the requested type
            const providers = await db_1.default.query.serviceProvider.findMany({
                where: (0, query_1.and)((0, query_1.eq)(schema_1.serviceProvider.serviceType, serviceType), (0, query_1.eq)(schema_1.serviceProvider.serviceStatus, enums_1.serviceStatusEnum.AVAILABLE)),
                columns: {
                    id: true,
                    name: true,
                    currentLocation: true,
                    serviceType: true,
                    serviceStatus: true,
                },
            });
            const providersWithDistance = providers
                .filter((provider) => provider.currentLocation)
                .map((provider) => ({
                ...provider,
                distance: (0, distance_1.calculateDistance)(userLocation, provider.currentLocation),
            }))
                .sort((a, b) => a.distance - b.distance);
            socket.emit(constants_1.SocketEventEnums.PROVIDER_FOUND, {
                providers: providersWithDistance,
            });
            console.log(`[SOCKET] Found ${providersWithDistance.length} available providers for ${serviceType}`);
        }
        catch (error) {
            console.log("[SOCKET] Error in emergency service request:", error);
            socket.emit(constants_1.SocketEventEnums.SOCKET_ERROR, {
                message: "Failed to find service providers",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });
};
const mountUpdateProviderStatusEvent = (socket) => {
    socket.on(constants_1.SocketEventEnums.UPDATE_PROVIDER_STATUS, async ({ status, }) => {
        try {
            if (!socket.user?.id) {
                console.log("No user ID found in socket");
                return;
            }
            // Update provider status in database
            const updated = await db_1.default
                .update(schema_1.serviceProvider)
                .set({ serviceStatus: status })
                .where((0, query_1.eq)(schema_1.serviceProvider.id, socket.user.id))
                .returning({
                id: schema_1.serviceProvider.id,
                serviceStatus: schema_1.serviceProvider.serviceStatus,
            });
            if (updated.length === 0) {
                console.log("Failed to update provider status");
                return;
            }
            // Broadcast status update to all users
            socket.broadcast.emit(constants_1.SocketEventEnums.PROVIDER_STATUS_UPDATED, {
                providerId: socket.user.id,
                status,
            });
            console.log(`[SOCKET] Provider ${socket.user.id} status updated to ${status}`);
        }
        catch (error) {
            console.log("[SOCKET] Error in provider status update:", error);
            socket.emit(constants_1.SocketEventEnums.SOCKET_ERROR, {
                message: "Failed to update provider status",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });
};
const authenticateUser = async (socket) => {
    const cookies = (0, cookie_1.parse)(socket.handshake.headers?.cookie || "");
    let token = cookies?.token;
    if (!token)
        token = socket.handshake.auth.token;
    if (!token)
        throw new ApiError_1.default(401, "Unauthorized");
    const decoded = (0, jwtTokens_1.verifyJWT)(token);
    if (!decoded || !decoded.id)
        throw new ApiError_1.default(401, "Unauthorized");
    const userEntity = await db_1.default.query.user.findFirst({
        where: (0, query_1.eq)(schema_1.user.id, decoded.id),
        columns: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            role: true,
            isVerified: true,
        },
    });
    if (userEntity) {
        socket.user = userEntity;
        socket.join(constants_1.SocketRoom.USER(userEntity.id));
        console.log("User connected ðŸ—¼. userId: ", userEntity.id.toString());
    }
    else {
        const serviceProviderEntity = await db_1.default.query.serviceProvider.findFirst({
            where: (0, query_1.eq)(schema_1.serviceProvider.id, decoded.id),
            columns: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                isVerified: true,
                organizationId: true,
            },
        });
        if (!serviceProviderEntity) {
            throw new ApiError_1.default(401, "Unidentified Role. Please Login again.");
        }
        socket.user = serviceProviderEntity;
        socket.join(constants_1.SocketRoom.PROVIDER(serviceProviderEntity.id));
        console.log("Service Provider connected ðŸ—¼. providerId: ", serviceProviderEntity.id.toString());
    }
    socket.emit(constants_1.SocketEventEnums.CONNECTION_EVENT);
    socket.emit(constants_1.SocketEventEnums.AUTHORIZED_EVENT);
};
const handleSocketConnection = async (socket) => {
    try {
        await authenticateUser(socket);
        mountJoinRoomEvent(socket);
        mountSendLocationEvent(socket);
        mountUserLocationEvent(socket);
        mountProviderFoundEvent(socket);
        mountRequestEmergencyServiceEvent(socket);
        mountUpdateProviderStatusEvent(socket);
        socket.on(constants_1.SocketEventEnums.LOCATION_UPDATE, ({ emergencyResponseId, location }) => {
            socket
                .to(constants_1.SocketRoom.EMERGENCY(emergencyResponseId))
                .emit(constants_1.SocketEventEnums.LOCATION_UPDATE, {
                userId: socket.user?.id,
                location,
                timestamp: new Date().toISOString(),
            });
        });
        socket.on(constants_1.SocketEventEnums.DISCONNECT_EVENT, () => {
            console.log("[SOCKET]: User has disconnected ðŸš«. userId: " + socket.user?.id);
            if (socket.user?.id) {
                socket.leave(socket.user.id);
            }
        });
    }
    catch (error) {
        console.log("[SOCKET]: Error authenticating user", error);
        socket.emit(constants_1.SocketEventEnums.SOCKET_ERROR, error instanceof Error
            ? error.message
            : "Something went wrong while connecting to the socket.");
    }
};
const initializeSocketIo = (io) => {
    return io.on(constants_1.SocketEventEnums.CONNECTION_EVENT, handleSocketConnection);
};
exports.initializeSocketIo = initializeSocketIo;
const emitSocketEvent = (req, roomId, event, payload) => {
    console.log("[SOCKET] Emitting event:", event, roomId);
    req.app.get("io").in(roomId).emit(event, payload);
};
exports.emitSocketEvent = emitSocketEvent;
