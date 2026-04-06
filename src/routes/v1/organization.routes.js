"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const organization_controller_1 = require("../../controllers/organization.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const express_1 = require("express");
const organizationRouter = (0, express_1.Router)();
const validateAdmin = (0, auth_middleware_1.validateRoleAuth)(["admin"]);
organizationRouter
    .route("/")
    .post(organization_controller_1.createOrganization)
    .get(validateAdmin, organization_controller_1.getAllOrganizations);
organizationRouter
    .route("/:id")
    .get(organization_controller_1.getOrganizationById)
    .delete(validateAdmin, organization_controller_1.deleteOrganization)
    .put(validateAdmin, organization_controller_1.updateOrganization);
exports.default = organizationRouter;
