"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envConfig = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(3000),
    HOST: zod_1.z.string().default("0.0.0.0"),
    CORS_ALLOWED_ORIGINS: zod_1.z.string().default("localhost,127.0.0.1"),
    MONGODB_URI: zod_1.z.string(),
    MONGODB_DB_NAME: zod_1.z.string().default("emerg"),
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    JWT_SECRET: zod_1.z.string(),
    JWT_EXPIRY: zod_1.z.coerce.number().default(3600),
    OTP_SECRET: zod_1.z.string(),
    TWILIO_ACCOUNT_SID: zod_1.z.string(),
    TWILIO_AUTH_TOKEN: zod_1.z.string(),
    TWILIO_FROM_NUMBER: zod_1.z.string().default(""),
    GALLI_MAPS_TOKEN: zod_1.z.string(),
    MAILTRAP_USER: zod_1.z.string(),
    MAILTRAP_PASS: zod_1.z.string(),
    GOOGLE_MAIL: zod_1.z.string(),
    GOOGLE_PASS: zod_1.z.string(),
    FCM_PROJECT_ID: zod_1.z.string().default(""),
    FCM_CLIENT_EMAIL: zod_1.z.string().default(""),
    FCM_PRIVATE_KEY: zod_1.z.string().default(""),
    DEFAULT_ALERT_RADIUS_KM: zod_1.z.coerce.number().default(15),
});
function createEnvConfig() {
    const parsedEnv = envSchema.safeParse(process.env);
    if (!parsedEnv.success) {
        console.log("❌ Invalid environment variables", parsedEnv.error.format());
        throw new Error("Invalid environment variables");
    }
    return {
        port: parsedEnv.data.PORT,
        host: parsedEnv.data.HOST,
        cors_allowed_origins: parsedEnv.data.CORS_ALLOWED_ORIGINS,
        mongodb_uri: parsedEnv.data.MONGODB_URI,
        mongodb_db_name: parsedEnv.data.MONGODB_DB_NAME,
        node_env: parsedEnv.data.NODE_ENV,
        jwt_secret: parsedEnv.data.JWT_SECRET,
        jwt_expiry: parsedEnv.data.JWT_EXPIRY,
        otp_secret: parsedEnv.data.OTP_SECRET,
        twilio_account_sid: parsedEnv.data.TWILIO_ACCOUNT_SID,
        twilio_auth_token: parsedEnv.data.TWILIO_AUTH_TOKEN,
        twilio_from_number: parsedEnv.data.TWILIO_FROM_NUMBER,
        galli_maps_token: parsedEnv.data.GALLI_MAPS_TOKEN,
        mailtrap_user: parsedEnv.data.MAILTRAP_USER,
        mailtrap_pass: parsedEnv.data.MAILTRAP_PASS,
        google_mail: parsedEnv.data.GOOGLE_MAIL,
        google_pass: parsedEnv.data.GOOGLE_PASS,
        fcm_project_id: parsedEnv.data.FCM_PROJECT_ID,
        fcm_client_email: parsedEnv.data.FCM_CLIENT_EMAIL,
        fcm_private_key: parsedEnv.data.FCM_PRIVATE_KEY,
        default_alert_radius_km: parsedEnv.data.DEFAULT_ALERT_RADIUS_KM,
    };
}
exports.envConfig = createEnvConfig();
