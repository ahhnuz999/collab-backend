"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const emergency_request_controller_1 = require("../../controllers/emergency-request.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const express_1 = require("express");
const emergencyRequestRouter = (0, express_1.Router)();
emergencyRequestRouter
    .route("/")
    .get((0, auth_middleware_1.validateRoleAuth)(["user"]), emergency_request_controller_1.getUsersEmergencyRequests)
    .post((0, auth_middleware_1.validateRoleAuth)(["user"]), emergency_request_controller_1.createEmergencyRequest);
emergencyRequestRouter.get("/recent", (0, auth_middleware_1.validateRoleAuth)(["user"]), emergency_request_controller_1.getRecentEmergencyRequests);
emergencyRequestRouter
    .route("/:id")
    .get(emergency_request_controller_1.getEmergencyRequest)
    .put(emergency_request_controller_1.updateEmergencyRequest)
    .delete((0, auth_middleware_1.validateRoleAuth)(["admin"]), emergency_request_controller_1.deleteEmergencyRequest);
exports.default = emergencyRequestRouter;
