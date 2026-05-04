"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const emergency_response_controller_1 = require("../../controllers/emergency-response.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const express_1 = require("express");
const emergencyResponseRouter = (0, express_1.Router)();
emergencyResponseRouter
    .route("/")
    // .get(validateRoleAuth(["user"]), getEmergencyResponse)
    .post((0, auth_middleware_1.validateRoleAuth)(["user"]), emergency_response_controller_1.createEmergencyResponse);
emergencyResponseRouter
    .route("/provider-responses")
    .get(auth_middleware_1.validateServiceProvider, emergency_response_controller_1.getProviderResponses);
emergencyResponseRouter
    .route("/:id")
    .get(emergency_response_controller_1.getEmergencyResponse)
    .put(emergency_response_controller_1.updateEmergencyResponse)
    .delete((0, auth_middleware_1.validateRoleAuth)(["admin"]), emergency_response_controller_1.deleteEmergencyResponse);
exports.default = emergencyResponseRouter;
