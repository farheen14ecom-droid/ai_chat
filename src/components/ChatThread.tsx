"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StoredChat } from "../lib/chats";
import Composer from "./Composer";
import MessageView from "./MessageView";

const SUGGESTIONS = [
  "What's the weather in Tokyo right now?",
  "What is (1249 * 37) / 6 + 2^10?",
  "What time is it in New York?",
];

type Props = {
  chat: StoredChat;
  onUpdate: (id: string, messages: UIMessage[]) => void;
  onOpenSidebar: () => void;
};

export default function ChatThread({ chat, onUpdate, onOpenSidebar }: Props) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, stop, error, regenerate } = useChat({
    id: chat.id,
    messages: chat.messages,
    transport,
  });
  const busy = status === "submitted" || status === "streaming";

  /* ----- save to the parent (which writes localStorage) ----- */
  const lastSaved = useRef(JSON.stringify(chat.messages));
  const latest = useRef(messages);
  useEffect(() => {
    latest.current = messages;
  });

  useEffect(() => {
    if (status !== "ready" && status !== "error") return;
    if (messages.length === 0) return;
    const sig = JSON.stringify(messages);
    if (sig === lastSaved.current) return;
    lastSaved.current = sig;
    onUpdate(chat.id, messages);
  }, [status, messages, chat.id, onUpdate]);

  // Keep partial work if the user switches chats mid-response
  useEffect(() => {
    return () => {
      const current = latest.current;
      if (current.length === 0) return;
      if (JSON.stringify(current) === lastSaved.current) return;
      onUpdate(chat.id, current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ----- scrolling: follow the stream unless the user scrolled up ----- */
  const scrollRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const [atBottom, setAtBottom] = useState(true);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stick.current = near;
    setAtBottom(near);
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stick.current) el.scrollTo({ top: el.scrollHeight });
  }, [messages, status]);

  function jumpToLatest() {
    const el = scrollRef.current;
    stick.current = true;
    el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }

  function send(text: string) {
    stick.current = true;
    sendMessage({ text });
  }

  const lastIndex = messages.length - 1;

  return (
    <>
      <header className="flex items-center gap-2 border-b border-line px-3 py-2.5 md:px-6">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open chat list"
          className="rounded-lg p-1.5 text-muted hover:text-ink md:hidden"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>
        <h1 className="truncate text-sm font-medium">{chat.title}</h1>
      </header>

      <div className="relative min-h-0 flex-1">
        <div ref={scrollRef} onScroll={onScroll} role="log" className="h-full overflow-y-auto">
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-xl flex-col justify-center px-4 pb-16">
              <h2 className="text-2xl font-semibold tracking-tight">Ask something that needs a lookup</h2>
              <p className="mt-2 text-muted">
                I can check live weather, calculate exactly, and tell the time in any city.
              </p>
              <ul className="mt-6 divide-y divide-line border-y border-line">
                {SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => send(s)}
                      className="w-full py-3 text-left hover:text-accent"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:px-6">
              {messages.map((m, i) => (
                <MessageView
                  key={m.id}
                  message={m}
                  showActions={!(busy && i === lastIndex)}
                  canRegenerate={i === lastIndex && !busy}
                  onRegenerate={() => regenerate()}
                />
              ))}

              {status === "submitted" && (
                <div className="flex gap-1.5 py-2" aria-label="Waiting for a response">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="h-2 w-2 rounded-full bg-muted motion-safe:animate-pulse"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              )}

              {error && (
                <div role="alert" className="rounded-xl border border-red-400/60 bg-red-500/10 p-3 text-sm">
                  <p className="font-medium">The request failed</p>
                  <p className="mt-1 break-words text-muted">{error.message}</p>
                  <p className="mt-1 text-muted">
                    Common causes: a rate limit, a wrong model name, or a missing API key in .env.local.
                  </p>
                  <button
                    type="button"
                    onClick={() => regenerate()}
                    className="mt-2 rounded-lg border border-line px-3 py-1 hover:bg-canvas"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {!atBottom && messages.length > 0 && (
          <button
            type="button"
            onClick={jumpToLatest}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-line bg-panel px-3 py-1.5 text-sm shadow-sm hover:bg-canvas"
          >
            Jump to latest
          </button>
        )}
      </div>

      <Composer onSend={send} onStop={() => stop()} busy={busy} />
    </>
  );
}