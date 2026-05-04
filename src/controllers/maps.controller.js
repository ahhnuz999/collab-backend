"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptimalRouteForUser = exports.getAutoComplete = void 0;
const db_1 = __importDefault(require("../db"));
const schema_1 = require("../db/schema");
const ApiError_1 = __importDefault(require("../utils/api/ApiError"));
const ApiResponse_1 = __importDefault(require("../utils/api/ApiResponse"));
const asyncHandler_1 = require("../utils/api/asyncHandler");
const galli_maps_1 = require("../utils/maps/galli-maps");
const query_1 = require("../db/query");
const getAutoComplete = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { q: searchQuery, lat: currentLat, lg: currentLong } = req.query;
    if (!searchQuery || searchQuery === "") {
        throw new ApiError_1.default(400, "Search query is required");
    }
    if (typeof searchQuery !== "string") {
        throw new ApiError_1.default(400, "Search query must be a string");
    }
    if ((currentLat && typeof currentLat !== "string") ||
        (currentLong && typeof currentLong !== "string")) {
        throw new ApiError_1.default(400, "Current latitude and longitude must be strings");
    }
    if (searchQuery.length < 3) {
        throw new ApiError_1.default(400, "Search query must be at least 3 characters long");
    }
    const loggedInUser = req.user;
    if (!loggedInUser || !loggedInUser.id) {
        throw new ApiError_1.default(400, "Unauthorized to perform this action");
    }
    let userLat, userLong, searchAutoCompleteResult;
    if (!currentLat || !currentLong) {
        const userInDb = await db_1.default.query.user.findFirst({
            where: (0, query_1.eq)(schema_1.user.id, loggedInUser.id),
        });
        if (!userInDb) {
            throw new ApiError_1.default(404, "User not found");
        }
        userLat = userInDb?.currentLocation?.latitude;
        userLong = userInDb?.currentLocation?.longitude;
        if (!userLat || !userLong) {
            throw new ApiError_1.default(404, "User location not found");
        }
        searchAutoCompleteResult = await (0, galli_maps_1.compeletAutoSearch)({
            searchQuery,
            currentLat: userLat,
            currentLong: userLong,
        });
    }
    else {
        searchAutoCompleteResult = await (0, galli_maps_1.compeletAutoSearch)({
            searchQuery,
            currentLat,
            currentLong,
        });
    }
    if (!searchAutoCompleteResult) {
        throw new ApiError_1.default(404, "No results found");
    }
    res
        .status(200)
        .json(new ApiResponse_1.default(200, "Search results found", searchAutoCompleteResult));
});
exports.getAutoComplete = getAutoComplete;
const getOptimalRouteForUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { srcLat, srcLng, dstLat, dstLng, mode } = req.query;
    if (!srcLat || !srcLng || !dstLat || !dstLng) {
        throw new ApiError_1.default(400, "Source and destination coordinates are required");
    }
    if (typeof srcLat !== "string" ||
        typeof srcLng !== "string" ||
        typeof dstLat !== "string" ||
        typeof dstLng !== "string" ||
        typeof mode !== "string") {
        throw new ApiError_1.default(400, "Source and destination coordinates must be strings");
    }
    const loggedInUser = req.user;
    if (!loggedInUser || !loggedInUser.id) {
        throw new ApiError_1.default(400, "Unauthorized to perform this action");
    }
    if (mode) {
        if (mode !== "DRIVING" && mode !== "WALKING" && mode !== "BICYCLING") {
            throw new ApiError_1.default(400, "Invalid mode parameter");
        }
    }
    const optimalRoute = await (0, galli_maps_1.getOptimalRoute)({
        srcLat,
        srcLng,
        dstLat,
        dstLng,
        mode: (mode || "DRIVING"),
    });
    if (!optimalRoute) {
        throw new ApiError_1.default(404, "No route found");
    }
    res
        .status(200)
        .json(new ApiResponse_1.default(200, "Optimal route found", optimalRoute));
});
exports.getOptimalRouteForUser = getOptimalRouteForUser;
