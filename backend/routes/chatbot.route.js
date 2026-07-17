import express from "express";
import { chatWithJobMate } from "../controllers/chatbot.controller.js";
import { chatbotLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.route("/message").post(chatbotLimiter, chatWithJobMate);

export default router;
