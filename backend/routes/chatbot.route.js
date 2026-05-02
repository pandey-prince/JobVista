import express from "express";
import { chatWithJobMate } from "../controllers/chatbot.controller.js";

const router = express.Router();

router.route("/message").post(chatWithJobMate);

export default router;
