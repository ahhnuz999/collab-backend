"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminEmails = exports.allowedOrigins = exports.corsOptions = void 0;
const env_config_1 = require("./env.config");
const allowedOrigins = env_config_1.envConfig.cors_allowed_origins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
exports.allowedOrigins = allowedOrigins;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const isPrivateIpv4 = (host) => {
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
        return true;
    }
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) {
        return true;
    }
    const match = host.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
    if (!match) {
        return false;
    }
    const secondOctet = Number(match[1]);
    return secondOctet >= 16 && secondOctet <= 31;
};
const normalizeOrigin = (origin) => {
    const trimmedOrigin = origin.trim();
    try {
        return new URL(trimmedOrigin).hostname;
    }
    catch {
        let normalizedOrigin = trimmedOrigin;
        if (normalizedOrigin.includes("//")) {
            normalizedOrigin = normalizedOrigin.split("//")[1] ?? normalizedOrigin;
        }
        if (normalizedOrigin.includes("/")) {
            normalizedOrigin = normalizedOrigin.split("/")[0] ?? normalizedOrigin;
        }
        if (normalizedOrigin.includes(":")) {
            normalizedOrigin = normalizedOrigin.split(":")[0] ?? normalizedOrigin;
        }
        return normalizedOrigin;
    }
};
const isAllowedOriginHost = (host) => {
    if (LOCAL_HOSTS.has(host)) {
        return true;
    }
    if (allowedOrigins.includes(host)) {
        return true;
    }
    if (env_config_1.envConfig.node_env === "development" && isPrivateIpv4(host)) {
        return true;
    }
    return false;
};
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        const normalizedOrigin = normalizeOrigin(String(origin));
        if (isAllowedOriginHost(normalizedOrigin)) {
            return callback(null, true);
        }
        return callback(new Error("The CORS policy for this site does not allow access from the specified Origin."), false);
    },
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
};
exports.corsOptions = corsOptions;
const adminEmails = ["test@admin.com"];
exports.adminEmails = adminEmails;
