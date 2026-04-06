"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const feedback_controller_1 = require("../../controllers/feedback.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const express_1 = require("express");
const feedbackRouter = (0, express_1.Router)();
feedbackRouter
    .route("/")
    .post((0, auth_middleware_1.validateRoleAuth)(["user"]), feedback_controller_1.createFeedback)
    .get((0, auth_middleware_1.validateRoleAuth)(["user"]), feedback_controller_1.getUsersFeedback);
feedbackRouter
    .route("/:id")
    .get(feedback_controller_1.getFeedback)
    .put((0, auth_middleware_1.validateRoleAuth)(["user", "admin"]), feedback_controller_1.updateFeedback)
    .delete((0, auth_middleware_1.validateRoleAuth)(["admin", "user"]), feedback_controller_1.deleteFeedback);
exports.default = feedbackRouter;
