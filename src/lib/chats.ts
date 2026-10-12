import type { UIMessage } from "ai";

export type StoredChat = {
  id: string;
  title: string;
  messages: UIMessage[];
  updatedAt: number;
};

const KEY = "ai-chat:chats:v1";

export function createChat(): StoredChat {
  return { id: crypto.randomUUID(), title: "New chat", messages: [], updatedAt: Date.now() };
}

export function messageText(message: UIMessage): string {
  let out = "";
  for (const part of message.parts) {
    if (part.type === "text") out += part.text;
  }
  return out;
}

export function titleFrom(messages: UIMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  const text = first ? messageText(first).trim().replace(/\s+/g, " ") : "";
  if (!text) return "New chat";
  return text.length > 48 ? text.slice(0, 48).trimEnd() + "…" : text;
}

// A tool call saved mid-flight would show "Running" forever after a reload.
function sanitize(messages: UIMessage[]): UIMessage[] {
  return messages.map((m) => ({
    ...m,
    parts: m.parts.map((p) => {
      const part = p as { type: string; state?: string };
      if (
        part.type.startsWith("tool-") &&
        part.state !== "output-available" &&
        part.state !== "output-error"
      ) {
        return { ...p, state: "output-error", errorText: "This tool call was interrupted." } as typeof p;
      }
      return p;
    }),
  }));
}

export function loadChats(): StoredChat[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter((c) => c && typeof c.id === "string" && Array.isArray(c.messages))
      .map((c) => ({ ...c, messages: sanitize(c.messages) }));
  } catch {
    return [];
  }
}

export function saveChats(chats: StoredChat[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(chats.filter((c) => c.messages.length > 0)));
  } catch {
    // Storage full or blocked: the app keeps working in memory.
  }
}