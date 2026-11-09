import { generateSpeech } from "../services/openaiTTS.service.js";

export const textToSpeech = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Text is required",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "OpenAI TTS is not configured. Falling back to browser speech synthesis.",
      });
    }

    const audioBuffer = await generateSpeech(text);

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audioBuffer);

  } catch (error) {
    console.warn("Backend TTS generation skipped (OpenAI key not active or failed):", error.message || error);

    res.status(503).json({
      success: false,
      message: "TTS generation unavailable",
    });
  }
};