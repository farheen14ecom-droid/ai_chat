"use client";

import type { StoredChat } from "../lib/chats";

type Props = {
  chats: StoredChat[];
  activeId: string | null;
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
};

export default function Sidebar({ chats, activeId, open, onClose, onSelect, onNew, onDelete }: Props) {
  const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={onClose} aria-hidden />}

      <aside
        aria-label="Chats"
        className={
          "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-line bg-canvas transition-transform motion-reduce:transition-none md:static md:translate-x-0 " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="p-3">
          <button
            type="button"
            onClick={onNew}
            className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-onaccent hover:opacity-90"
          >
            New chat
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          <ul className="space-y-0.5">
            {sorted.map((c) => {
              const active = c.id === activeId;
              return (
                <li key={c.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    aria-current={active ? "page" : undefined}
                    className={
                      "block w-full truncate rounded-lg px-3 py-2 pr-9 text-left text-sm " +
                      (active
                        ? "bg-panel font-medium shadow-sm"
                        : "text-muted hover:bg-panel/60 hover:text-ink")
                    }
                  >
                    {c.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Delete this chat?")) onDelete(c.id);
                    }}
                    aria-label={`Delete chat: ${c.title}`}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted opacity-0 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <p className="border-t border-line px-4 py-3 text-xs text-muted">
          Chats are saved in this browser only.
        </p>
      </aside>
    </>
  );
}