"use client";

import type { UIMessage } from "ai";
import { messageText } from "../lib/chats";
import CopyButton from "./CopyButton";
import Markdown from "./Markdown";
import ToolCard, { type ToolPart } from "./ToolCard";

type Props = {
  message: UIMessage;
  showActions: boolean;
  canRegenerate: boolean;
  onRegenerate: () => void;
};

export default function MessageView({ message, showActions, canRegenerate, onRegenerate }: Props) {
  const text = messageText(message);

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-onaccent">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div>
      {message.parts.map((part, i) => {
        if (part.type === "text") return part.text ? <Markdown key={i}>{part.text}</Markdown> : null;
        if (part.type.startsWith("tool-")) return <ToolCard key={i} part={part as unknown as ToolPart} />;
        return null; // reasoning and other parts are not shown
      })}

      {showActions && text && (
        <div className="mt-2 flex gap-4 text-xs text-muted">
          <CopyButton text={text} label="Copy" />
          {canRegenerate && (
            <button type="button" onClick={onRegenerate} className="hover:text-ink">
              Regenerate
            </button>
          )}
        </div>
      )}
    </div>
  );
}