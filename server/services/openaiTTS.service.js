import openai from "../config/openai.js";

export const generateSpeech = async (text) => {
  if (!openai) {
    throw new Error("OpenAI API key is not configured.");
  }

  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: text,
    format: "mp3",
  });

  return Buffer.from(await mp3.arrayBuffer());
};