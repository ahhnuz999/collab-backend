"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistance = void 0;
/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param coord1 First coordinate point
 * @param coord2 Second coordinate point
 * @returns Distance in kilometers
 */
const calculateDistance = (coord1, coord2) => {
    const R = 6371; // Earth's radius in kilometers
    const lat1 = (parseFloat(coord1.latitude.toString()) * Math.PI) / 180;
    const lat2 = (parseFloat(coord2.latitude.toString()) * Math.PI) / 180;
    const deltaLat = ((parseFloat(coord2.latitude.toString()) -
        parseFloat(coord1.latitude.toString())) *
        Math.PI) /
        180;
    const deltaLon = ((parseFloat(coord2.longitude.toString()) -
        parseFloat(coord1.longitude.toString())) *
        Math.PI) /
        180;
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(deltaLon / 2) *
            Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
};
exports.calculateDistance = calculateDistance;
