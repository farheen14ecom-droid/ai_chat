"use client";

import ReactMarkdown from "react-markdown";
import { Children, isValidElement, type ReactNode } from "react";
import CopyButton from "./CopyButton";

function CodeBlock({ children }: { children?: ReactNode }) {
  const child = Children.toArray(children)[0];
  let code = "";
  let lang = "";
  if (isValidElement(child)) {
    const props = child.props as { className?: string; children?: ReactNode };
    lang = /language-([\w-]+)/.exec(props.className ?? "")?.[1] ?? "";
    code = String(props.children ?? "").replace(/\n$/, "");
  }
  return (
    <div className="my-3 overflow-hidden rounded-lg border border-line bg-canvas">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5 text-xs text-muted">
        <span>{lang || "code"}</span>
        <CopyButton text={code} label="Copy code" />
      </div>
      <pre className="overflow-x-auto p-3 text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        components={{
          pre: CodeBlock,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}