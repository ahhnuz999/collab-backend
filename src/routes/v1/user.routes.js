"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_controller_1 = require("../../controllers/user.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const express_1 = __importDefault(require("express"));
const userRouter = express_1.default.Router();
const validateUser = (0, auth_middleware_1.validateRoleAuth)(["user"]);
userRouter.route("/register").post(user_controller_1.registerUser);
userRouter.route("/login").post(user_controller_1.loginUser);
userRouter
    .route("/logout")
    .get((0, auth_middleware_1.validateRoleAuth)(["admin", "user"]), user_controller_1.logoutUser);
userRouter
    .route("/update")
    .put((0, auth_middleware_1.validateRoleAuth)(["admin", "user"]), user_controller_1.updateUser);
userRouter.route("/verify").post(user_controller_1.verifyUser);
userRouter.route("/forgot-password").post(user_controller_1.forgotPassword);
userRouter.route("/reset-password").post(user_controller_1.resetPassword);
userRouter.route("/change-password").post(validateUser, user_controller_1.changePassword);
userRouter.route("/profile").get(validateUser, user_controller_1.getProfile);
userRouter.post("/update-push-token", validateUser, user_controller_1.updatePushToken);
userRouter.route("/:userId").get(user_controller_1.getUser);
exports.default = userRouter;
