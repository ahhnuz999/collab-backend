"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongoDB = connectMongoDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_config_1 = require("../config/env.config");
const models_1 = require("../db/models");
let isMongoConnected = false;
async function ensureMongoCollections() {
    for (const model of models_1.appModels) {
        await model.createCollection().catch((error) => {
            const message = error?.message || "";
            if (!message.includes("already exists")) {
                throw error;
            }
        });
    }
}
async function connectMongoDB() {
    if (isMongoConnected) {
        return mongoose_1.default.connection;
    }
    console.log("URI:", env_config_1.envConfig.mongodb_uri);
    console.log("DB NAME:", env_config_1.envConfig.mongodb_db_name);
    const connection = await mongoose_1.default.connect(env_config_1.envConfig.mongodb_uri, {
        dbName: env_config_1.envConfig.mongodb_db_name,
    });
    await ensureMongoCollections();
    isMongoConnected = true;
    console.log(`MongoDB connected: ${connection.connection.name}`);
    return connection.connection;
}
