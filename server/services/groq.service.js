import { getGroqClient } from "../config/groq.js";

// Models known to be active on Groq for this account
const FALLBACK_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
];

/**
 * Strips markdown code blocks from AI response (e.g. ```json ... ```)
 */
export const cleanAiResponse = (content) => {
  if (!content || typeof content !== "string") return "";
  let text = content.trim();

  // If wrapped in markdown code fences
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  return text;
};

/**
 * Auto-repairs truncated JSON (e.g., if cut off by max_tokens limit)
 */
export const repairTruncatedJson = (str) => {
  if (!str || typeof str !== "string") return "{}";
  let text = str.trim();

  // Start from first opening brace if present
  const firstBrace = text.indexOf("{");
  if (firstBrace !== -1) {
    text = text.substring(firstBrace);
  }

  let inString = false;
  let escaped = false;
  const stack = [];

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (c === "\\") {
      escaped = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (c === "{" || c === "[") {
        stack.push(c);
      } else if (c === "}" || c === "]") {
        stack.pop();
      }
    }
  }

  let repaired = text;
  // If string was truncated mid-quote, close the quote
  if (inString) {
    repaired += '"';
  }

  // Close unclosed arrays and objects
  while (stack.length > 0) {
    const top = stack.pop();
    repaired = repaired.replace(/,\s*$/, "");
    repaired += top === "{" ? "}" : "]";
  }

  return repaired;
};

/**
 * Extracts and safely parses JSON from AI output even if wrapped with markdown or truncated
 */
export const safeParseJson = (content) => {
  const cleaned = cleanAiResponse(content);
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Attempt 1: Search for outermost balanced { ... }
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const sliced = cleaned.substring(firstBrace, lastBrace + 1);
        return JSON.parse(sliced);
      } catch (_) {}
    }

    // Attempt 2: Auto-repair truncated JSON
    try {
      const repaired = repairTruncatedJson(cleaned);
      return JSON.parse(repaired);
    } catch (_) {}

    throw err;
  }
};

/**
 * Generate chat completion using Groq LLM with auto-fallback for missing models
 */
export const askAi = async (messages, options = {}) => {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new Error("Messages array is empty.");
  }

  const groq = getGroqClient();
  let configuredModel = options.model || process.env.GROQ_MODEL || FALLBACK_MODELS[0];
  if (configuredModel === "llama-3.3-70b-versatile") {
    configuredModel = FALLBACK_MODELS[0];
  }

  // Build candidate model list with configuredModel first, followed by fallbacks
  const candidateModels = [
    configuredModel,
    ...FALLBACK_MODELS.filter((m) => m !== configuredModel),
  ];

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const params = {
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 4096,
      };

      if (options.jsonMode) {
        params.response_format = { type: "json_object" };
      }

      const response = await groq.chat.completions.create(params);
      const content = response.choices?.[0]?.message?.content;

      if (!content || !content.trim()) {
        throw new Error("Groq returned an empty response.");
      }

      return cleanAiResponse(content);
    } catch (error) {
      const errorMsg = error.message || String(error);
      const isModelNotFound =
        error.status === 404 ||
        errorMsg.includes("model_not_found") ||
        errorMsg.includes("does not exist") ||
        errorMsg.includes("do not have access");

      if (isModelNotFound && model !== candidateModels[candidateModels.length - 1]) {
        console.warn(`Groq model '${model}' not available. Falling back to alternative model...`);
        lastError = error;
        continue;
      }

      console.error(`Groq AI Error (model: ${model}):`, errorMsg);
      throw new Error(`Groq API Error: ${errorMsg}`);
    }
  }

  throw lastError || new Error("Failed to get response from any Groq model.");
};

export default {
  askAi,
  cleanAiResponse,
  repairTruncatedJson,
  safeParseJson,
};
