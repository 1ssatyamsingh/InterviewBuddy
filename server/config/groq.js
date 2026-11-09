import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

let groqInstance = null;

export const getGroqClient = () => {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GROQ_API_KEY is not set in server/.env");
    }
    groqInstance = new Groq({
      apiKey: apiKey || "",
    });
  }
  return groqInstance;
};

export default getGroqClient;
