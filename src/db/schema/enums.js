"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceEnum = exports.serviceStatusEnum = exports.serviceStatusValues = exports.serviceTypeEnum = exports.serviceTypeValues = void 0;
const zod_1 = require("zod");
exports.serviceTypeValues = [
    "ambulance",
    "police",
    "rescue_team",
    "fire_truck",
];
exports.serviceTypeEnum = {
    enumValues: exports.serviceTypeValues,
    schema: zod_1.z.enum(exports.serviceTypeValues),
};
exports.serviceStatusValues = [
    "available",
    "assigned",
    "off_duty",
];
var serviceStatusEnum;
(function (serviceStatusEnum) {
    serviceStatusEnum["AVAILABLE"] = "available";
    serviceStatusEnum["ASSIGNED"] = "assigned";
    serviceStatusEnum["OFF_DUTY"] = "off_duty";
})(serviceStatusEnum || (exports.serviceStatusEnum = serviceStatusEnum = {}));
var serviceEnum;
(function (serviceEnum) {
    serviceEnum["AMBULANCE"] = "ambulance";
    serviceEnum["POLICE"] = "police";
    serviceEnum["RESCUE_TEAM"] = "rescue_team";
    serviceEnum["FIRE_TRUCK"] = "fire_truck";
})(serviceEnum || (exports.serviceEnum = serviceEnum = {}));
