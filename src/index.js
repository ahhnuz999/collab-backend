"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const socket_io_1 = require("socket.io");
const env_config_1 = require("./config/env.config");
const routes_1 = require("./routes");
const config_1 = require("./config");
const socket_1 = require("./socket");
const ApiResponse_1 = __importDefault(require("./utils/api/ApiResponse"));
const mongodb_1 = require("./db/mongodb");
const rate_limit_middleware_1 = require("./middlewares/rate-limit.middleware");
const error_middleware_1 = require("./middlewares/error.middleware");
const models_1 = require("./db/models");
const app = (0, express_1.default)();
const port = env_config_1.envConfig.port;
const host = env_config_1.envConfig.host;
async function listenWithPortFallback(httpServer, preferredPort, bindHost) {
    let currentPort = preferredPort;
    const maxAttempts = env_config_1.envConfig.node_env === "production" ? 1 : 10;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
            await new Promise((resolve, reject) => {
                const handleListening = () => {
                    httpServer.off("error", handleError);
                    resolve();
                };
                const handleError = (error) => {
                    httpServer.off("listening", handleListening);
                    reject(error);
                };
                httpServer.once("error", handleError);
                httpServer.once("listening", handleListening);
                httpServer.listen(currentPort, bindHost);
            });
            const addressInfo = httpServer.address();
            const activePort = typeof addressInfo === "object" && addressInfo ? addressInfo.port : currentPort;
            console.log(`Server is listening on: http://${bindHost}:${activePort}`);
            if (activePort !== preferredPort) {
                console.log(`Preferred port ${preferredPort} was busy, so the server started on ${activePort} instead.`);
            }
            return;
        }
        catch (error) {
            if (error?.code === "EADDRINUSE" && env_config_1.envConfig.node_env !== "production") {
                console.log(`Port ${currentPort} is already in use. Retrying on ${currentPort + 1}...`);
                currentPort += 1;
                continue;
            }
            throw error;
        }
    }
    throw new Error(`Unable to bind the server after trying ports ${preferredPort}-${currentPort}.`);
}
// middlewares
app.use((0, cors_1.default)(config_1.corsOptions));
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, rate_limit_middleware_1.createRateLimiter)({ limit: 300, windowMs: 60_000 }));
// Root route
app.get("/", (_req, res) => {
    res.status(200).json(new ApiResponse_1.default(200, "ResQ backend ready", {
        apiBaseUrl: `/api`,
        legacyApiBaseUrl: `/api/v1`,
        healthcheck: `/api/v1/healthcheck`,
    }));
});
// ✅ New GET /users route
app.get("/api/v1/users", async (_req, res) => {
    try {
        const users = await models_1.UserModel.find({})
            .select({
            _id: 0,
            id: 1,
            name: 1,
            age: 1,
            phoneNumber: 1,
            email: 1,
            primaryAddress: 1,
            role: 1,
            currentLocation: 1,
            medicalInfo: 1,
            createdAt: 1,
            updatedAt: 1,
        })
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json(new ApiResponse_1.default(200, "Fetched users successfully", users));
    }
    catch (err) {
        res.status(500).json(new ApiResponse_1.default(500, "Error fetching users", {
            error: err.message,
        }));
    }
});
app.use("/api", routes_1.apiRouter);
// V1 API routes
app.use("/api/v1", routes_1.v1Router);
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
async function startServer() {
    try {
        await (0, mongodb_1.connectMongoDB)();
        const httpServer = (0, http_1.createServer)(app);
        const io = new socket_io_1.Server(httpServer, { cors: config_1.corsOptions });
        app.set("io", io);
        // Socket.io event handlers
        (0, socket_1.initializeSocketIo)(io);
        // Start server on specified port, with a development fallback when the port is busy.
        await listenWithPortFallback(httpServer, port, host);
    }
    catch (error) {
        console.log("Error starting server", error);
    }
}
// Start server
void startServer();
