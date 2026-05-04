"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const emergency_api_controller_1 = require("../../controllers/emergency-api.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const express_1 = require("express");
const adminRouter = (0, express_1.Router)();
adminRouter.get("/emergencies/active", (0, auth_middleware_1.validateRoleAuth)(["admin"]), emergency_api_controller_1.getActiveEmergencies);
adminRouter.post("/emergencies/:id/assign", (0, auth_middleware_1.validateRoleAuth)(["admin"]), emergency_api_controller_1.assignResponder);
exports.default = adminRouter;
