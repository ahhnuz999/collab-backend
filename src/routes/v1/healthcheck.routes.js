"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const healthcheck_controller_1 = require("../../controllers/healthcheck.controller");
const express_1 = require("express");
const healthCheckRouter = (0, express_1.Router)();
healthCheckRouter.route("/").get(healthcheck_controller_1.healthCheck);
exports.default = healthCheckRouter;
