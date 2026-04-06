"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reverseGeoCode = exports.getOptimalRoute = exports.compeletAutoSearch = void 0;
const env_config_1 = require("../../config/env.config");
const axios_1 = __importDefault(require("axios"));
const MAPS_ACCESS_TOKEN = env_config_1.envConfig.galli_maps_token;
const BASE_API = `https://route-init.gallimap.com/api/v1`;
const compeletAutoSearch = async ({ searchQuery, currentLat, currentLong, }) => {
    try {
        if (searchQuery.length < 4) {
            return null;
        }
        const response = await axios_1.default.get(`${BASE_API}/search/autocomplete`, {
            params: {
                accessToken: MAPS_ACCESS_TOKEN,
                word: searchQuery,
                lat: currentLat,
                lng: currentLong,
            },
        });
        console.log("response from galli maps", response);
        if (response.data.success) {
            return response.data.data;
        }
        return null;
    }
    catch (error) {
        console.log("Error while fetching maps autocomplete data", error);
        return null;
    }
};
exports.compeletAutoSearch = compeletAutoSearch;
const getOptimalRoute = async ({ srcLat, srcLng, dstLat, dstLng, mode = "DRIVING", }) => {
    try {
        console.log("srcLat, srcLng, dstLat, dstLng", srcLat, srcLng, dstLat, dstLng);
        const response = await axios_1.default.get(`${BASE_API}/routing`, {
            params: {
                accessToken: MAPS_ACCESS_TOKEN,
                srcLat,
                srcLng,
                dstLat,
                dstLng,
                mode,
            },
        });
        if (response.data.success) {
            return response.data.data.data;
        }
        return null;
    }
    catch (error) {
        console.log("Error while fetching maps routing data", error);
        return null;
    }
};
exports.getOptimalRoute = getOptimalRoute;
const reverseGeoCode = async (lat, lng) => {
    console.log("lat, lng", lat, lng);
    try {
        const response = await axios_1.default.get(`${BASE_API}/reverse/generalReverse`, {
            params: {
                accessToken: MAPS_ACCESS_TOKEN,
                lat,
                lng,
            },
        });
        if (response.data.success) {
            console.log("location", response.data.data);
            return response.data.data;
        }
        return null;
    }
    catch (error) {
        console.log("Error while fetching maps data", error);
        return null;
    }
};
exports.reverseGeoCode = reverseGeoCode;
