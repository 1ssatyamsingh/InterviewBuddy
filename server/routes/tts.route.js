import express from "express";
import { textToSpeech } from "../controllers/tts.controller.js";

const ttsRouter = express.Router();

ttsRouter.post("/", textToSpeech);

export default ttsRouter;