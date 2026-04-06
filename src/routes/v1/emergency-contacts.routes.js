"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const emergency_contacts_controller_1 = require("../../controllers/emergency-contacts.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const emergencyContactsRouter = express_1.default.Router();
emergencyContactsRouter
    .route("/")
    .post((0, auth_middleware_1.validateRoleAuth)(["user"]), emergency_contacts_controller_1.createEmergencyContact)
    .get((0, auth_middleware_1.validateRoleAuth)(["user"]), emergency_contacts_controller_1.getUserEmergencyContacts);
emergencyContactsRouter.get("/common/all", emergency_contacts_controller_1.getCommonEmergencyContacts);
emergencyContactsRouter
    .route("/:id")
    .get(emergency_contacts_controller_1.getEmergencyContact)
    .put((0, auth_middleware_1.validateRoleAuth)(["user"]), emergency_contacts_controller_1.updateEmergencyContact)
    .delete((0, auth_middleware_1.validateRoleAuth)(["user", "admin"]), emergency_contacts_controller_1.deleteEmergencyContact);
exports.default = emergencyContactsRouter;
