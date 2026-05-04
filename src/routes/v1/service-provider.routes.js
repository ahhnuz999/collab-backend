"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const service_provider_controller_1 = require("../../controllers/service-provider.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const express_1 = require("express");
const serviceProviderRouter = (0, express_1.Router)();
const validateAdmin = (0, auth_middleware_1.validateRoleAuth)(["admin"]);
// Public routes
serviceProviderRouter.post("/login", service_provider_controller_1.loginServiceProvider);
serviceProviderRouter.post("/verify", service_provider_controller_1.verifyServiceProvider);
serviceProviderRouter.post("/forgot-password", service_provider_controller_1.forgotServiceProviderPassword);
serviceProviderRouter.post("/reset-password", service_provider_controller_1.resetServiceProviderPassword);
serviceProviderRouter.get("/nearby", service_provider_controller_1.getNearbyProviders);
// Admin-created credentials only
serviceProviderRouter.post("/register", validateAdmin, service_provider_controller_1.registerServiceProvider);
// Protected routes
serviceProviderRouter.use(auth_middleware_1.validateServiceProvider);
serviceProviderRouter.post("/logout", service_provider_controller_1.logoutServiceProvider);
serviceProviderRouter.get("/profile", service_provider_controller_1.getServiceProviderProfile);
serviceProviderRouter.patch("/update", service_provider_controller_1.updateServiceProvider);
serviceProviderRouter.delete("/delete", service_provider_controller_1.deleteServiceProvider);
serviceProviderRouter.post("/change-password", service_provider_controller_1.changeProviderPassword);
serviceProviderRouter.get("/:id", service_provider_controller_1.getServiceProvider);
serviceProviderRouter.patch("/status", service_provider_controller_1.updateServiceProviderStatus);
exports.default = serviceProviderRouter;
