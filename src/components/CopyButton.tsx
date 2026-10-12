"use client";

import { useState } from "react";

export default function CopyButton({
  text,
  label = "Copy",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      // Clipboard can be blocked; nothing useful to do.
    }
  }

  return (
    <button type="button" onClick={copy} className={`hover:text-ink ${className}`}>
      {done ? "Copied" : label}
    </button>
  );
}