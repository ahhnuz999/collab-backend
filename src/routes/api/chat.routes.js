"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../../controllers/chat.controller");
const rate_limit_middleware_1 = require("../../middlewares/rate-limit.middleware");

const chatRouter = (0, express_1.Router)();

chatRouter.post("/message", (0, rate_limit_middleware_1.createRateLimiter)({ limit: 30, windowMs: 60_000 }), chat_controller_1.sendChatMessage);

exports.default = chatRouter;
