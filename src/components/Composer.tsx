"use client";

import { useEffect, useRef, useState } from "react";

const MAX = 2000;

export default function Composer({
  onSend,
  onStop,
  busy,
}: {
  onSend: (text: string) => void;
  onStop: () => void;
  busy: boolean;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grow with the content, up to a limit
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  // Focus on desktop only, so phones do not open the keyboard on load
  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) ref.current?.focus();
  }, []);

  function submit() {
    const text = value.trim();
    if (!text || busy) return;
    onSend(text);
    setValue("");
  }

  return (
    <div className="border-t border-line bg-panel">
      <div className="mx-auto max-w-2xl px-4 py-3 md:px-6">
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-panel py-2 pl-4 pr-2 focus-within:border-accent">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            maxLength={MAX}
            placeholder="Message"
            aria-label="Message"
            className="max-h-[200px] min-h-7 flex-1 resize-none bg-transparent py-1 leading-6 outline-none placeholder:text-muted"
          />
          {busy ? (
            <button
              type="button"
              onClick={onStop}
              className="h-9 rounded-xl border border-line px-3 text-sm hover:bg-canvas"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!value.trim()}
              className="h-9 rounded-xl bg-accent px-4 text-sm font-medium text-onaccent hover:opacity-90 disabled:opacity-40"
            >
              Send
            </button>
          )}
        </div>
        <p className="mt-1.5 flex justify-between px-1 text-xs text-muted">
          <span>Enter to send, Shift+Enter for a new line</span>
          {value.length > 1500 && (
            <span>
              {value.length}/{MAX}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}