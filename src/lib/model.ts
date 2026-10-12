import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { wrapLanguageModel } from "ai";

/**
 * One place to choose the model provider.
 * Any provider with an OpenAI-compatible endpoint works. Switching providers
 * means changing three environment variables, not code.
 *
 *   Groq:        https://api.groq.com/openai/v1               openai/gpt-oss-120b
 *   Gemini:      https://generativelanguage.googleapis.com/v1beta/openai/   gemini-2.5-flash
 *   OpenRouter:  https://openrouter.ai/api/v1                 (pick a ":free" model)
 */
const baseURL = process.env.LLM_BASE_URL;
const apiKey = process.env.LLM_API_KEY;
const modelId = process.env.LLM_MODEL;

export function getModel() {
  if (!baseURL || !apiKey || !modelId) {
    throw new Error(
      "Missing LLM_BASE_URL, LLM_API_KEY or LLM_MODEL. Copy .env.example to .env.local and fill them in."
    );
  }
  const provider = createOpenAICompatible({
    name: "llm",
    baseURL,
    apiKey,
  });

  // Reasoning models (e.g. gpt-oss) return their thinking as separate "reasoning"
  // parts. Some providers reject those parts when they are sent back in the next
  // step of a tool-calling loop ("reasoning_content is unsupported").
  // This middleware removes them from assistant messages before each request.
  return wrapLanguageModel({
    model: provider(modelId),
    middleware: {
      transformParams: async ({ params }) => ({
        ...params,
        prompt: params.prompt.map((message) =>
          message.role === "assistant"
            ? {
                ...message,
                content: message.content.filter((part) => part.type !== "reasoning"),
              }
            : message
        ),
      }),
    },
  });
}