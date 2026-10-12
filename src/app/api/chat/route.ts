import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { getModel } from "../../../lib/model";
import { tools } from "../../../lib/tools";

export const maxDuration = 30;

const MAX_CHARS = 2000; // per user message
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

// Simple in-memory rate limiter. It resets on cold starts and is per-instance,
// which is fine for learning. In production use Redis/Upstash or similar.
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_REQUESTS_PER_WINDOW;
}

function lastUserText(messages: UIMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === "user");
  return (
    last?.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { text: string }).text)
      .join("") ?? ""
  );
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return new Response("Too many requests. Wait a minute and try again.", { status: 429 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  if (lastUserText(messages).length > MAX_CHARS) {
    return new Response(`Message too long (max ${MAX_CHARS} characters).`, { status: 400 });
  }

  const result = streamText({
    model: getModel(),
    system:
      "You are a helpful assistant. Use tools when they help: weather for current conditions, calculator for any arithmetic, time for the current time in a zone. Keep answers concise.",
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5), // lets the model call a tool, read the result, then answer
  });

  return result.toUIMessageStreamResponse();
}
