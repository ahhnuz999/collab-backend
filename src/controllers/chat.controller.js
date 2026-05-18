"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendChatMessage = void 0;
const crypto_1 = require("crypto");
const zod_1 = require("zod");
const env_config_1 = require("../config/env.config");
const models_1 = require("../db/models");
const ApiError_1 = require("../utils/api/ApiError");
const ApiResponse_1 = require("../utils/api/ApiResponse");
const asyncHandler_1 = require("../utils/api/asyncHandler");

const chatSchema = zod_1.z.object({
    conversationId: zod_1.z.string().min(1).optional(),
    message: zod_1.z.string().trim().min(1).max(1200),
    userId: zod_1.z.string().min(1).optional(),
});

const systemInstruction = [
    "You are EmerG Assistant, a calm emergency-help chatbot inside a college project app.",
    "Answer questions about emergency help, hospital information, safety guidance, and how to use the EmerG app.",
    "Keep replies short, helpful, beginner-friendly, and action-oriented.",
    "For life-threatening emergencies, tell the user to call local emergency services immediately and use the EmerG request flow.",
    "Do not claim to dispatch services yourself. Do not provide medical diagnosis.",
].join(" ");

function compactHistory(messages) {
    return messages.slice(-8).map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.text }],
    }));
}
function compactOpenRouterHistory(messages) {
    return messages.slice(-8).map((message) => ({
        role: message.role,
        content: message.text,
    }));
}
async function callOpenRouter(messages, latestMessage) {
    if (!env_config_1.envConfig.openrouter_api_key) {
        throw new ApiError_1.default(500, "OpenRouter API key is not configured on the backend.");
    }
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env_config_1.envConfig.openrouter_api_key}`,
            "HTTP-Referer": "https://emerg.local",
            "X-Title": "EmerG Assistant",
        },
        body: JSON.stringify({
            model: env_config_1.envConfig.openrouter_model,
            messages: [
                { role: "system", content: systemInstruction },
                ...compactOpenRouterHistory(messages),
                { role: "user", content: latestMessage },
            ],
            temperature: 0.35,
            max_tokens: 220,
        }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
        const message = payload?.error?.message || "OpenRouter API request failed.";
        throw new ApiError_1.default(response.status, message);
    }
    const text = payload?.choices?.[0]?.message?.content?.trim();
    if (!text) {
        throw new ApiError_1.default(502, "OpenRouter returned an empty response.");
    }
    return text;
}

async function callGemini(messages, latestMessage) {
    if (!env_config_1.envConfig.gemini_api_key) {
        throw new ApiError_1.default(500, "Gemini API key is not configured on the backend.");
    }
    const model = env_config_1.envConfig.gemini_model.replace(/^models\//, "");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env_config_1.envConfig.gemini_api_key,
        },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: systemInstruction }],
            },
            contents: [
                ...compactHistory(messages),
                {
                    role: "user",
                    parts: [{ text: latestMessage }],
                },
            ],
            generationConfig: {
                temperature: 0.35,
                maxOutputTokens: 220,
            },
        }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
        const message = payload?.error?.message || "Gemini API request failed.";
        throw new ApiError_1.default(response.status, message);
    }
    const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
    if (!text) {
        throw new ApiError_1.default(502, "Gemini returned an empty response.");
    }
    return text;
}
async function callAi(messages, latestMessage) {
    if (env_config_1.envConfig.ai_provider === "gemini") {
        return callGemini(messages, latestMessage);
    }
    return callOpenRouter(messages, latestMessage);
}

exports.sendChatMessage = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const payload = chatSchema.parse(req.body);
    const conversationId = payload.conversationId || (0, crypto_1.randomUUID)();
    const now = new Date();
    let conversation = await models_1.ChatConversationModel.findOne({ conversationId });
    if (!conversation) {
        conversation = await models_1.ChatConversationModel.create({
            conversationId,
            userId: payload.userId,
            messages: [],
            lastMessageAt: now,
        });
    }
    const history = [...(conversation.messages || [])];
    conversation.userId = conversation.userId || payload.userId;
    conversation.messages.push({ role: "user", text: payload.message, timestamp: now });
    conversation.lastMessageAt = new Date();
    await conversation.save();
    const reply = await callAi(history, payload.message);
    conversation.messages.push({ role: "assistant", text: reply, timestamp: new Date() });
    conversation.lastMessageAt = new Date();
    await conversation.save();
    return res.status(200).json(new ApiResponse_1.default(200, "Chat response generated", {
        conversationId,
        reply,
        messages: conversation.messages,
    }));
});
