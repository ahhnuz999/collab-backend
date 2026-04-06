"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_routes_1 = __importDefault(require("./admin.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const contacts_routes_1 = __importDefault(require("./contacts.routes"));
const emergency_routes_1 = __importDefault(require("./emergency.routes"));
const users_routes_1 = __importDefault(require("./users.routes"));
const apiRouter = (0, express_1.Router)();
apiRouter.use("/auth", auth_routes_1.default);
apiRouter.use("/users", users_routes_1.default);
apiRouter.use("/contacts", contacts_routes_1.default);
apiRouter.use("/emergency", emergency_routes_1.default);
apiRouter.use("/admin", admin_routes_1.default);
exports.default = apiRouter;
