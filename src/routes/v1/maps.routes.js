"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const maps_controller_1 = require("../../controllers/maps.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const express_1 = require("express");
const mapsRouter = (0, express_1.Router)();
mapsRouter
    .route("/autocomplete")
    .get((0, auth_middleware_1.validateRoleAuth)(["user", "admin"]), maps_controller_1.getAutoComplete);
mapsRouter
    .route("/optimal-route")
    .get((0, auth_middleware_1.validateRoleAuth)(["user", "admin"]), maps_controller_1.getOptimalRouteForUser);
exports.default = mapsRouter;
