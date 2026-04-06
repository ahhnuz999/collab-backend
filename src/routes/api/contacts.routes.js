"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contacts_api_controller_1 = require("../../controllers/contacts-api.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const express_1 = require("express");
const contactsRouter = (0, express_1.Router)();
contactsRouter.post("/", (0, auth_middleware_1.validateRoleAuth)(["user", "admin"]), contacts_api_controller_1.createContact);
contactsRouter.get("/", (0, auth_middleware_1.validateRoleAuth)(["user", "admin"]), contacts_api_controller_1.listContacts);
exports.default = contactsRouter;
