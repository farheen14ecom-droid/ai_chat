"use client";

import type { UIMessage } from "ai";
import { useCallback, useEffect, useState } from "react";
import { createChat, loadChats, saveChats, titleFrom, type StoredChat } from "../lib/chats";
import ChatThread from "./ChatThread";
import Sidebar from "./Sidebar";

export default function Chat() {
  const [chats, setChats] = useState<StoredChat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Read localStorage after mount so server and client render the same HTML
  useEffect(() => {
    const loaded = loadChats();
    if (loaded.length > 0) {
      setChats(loaded);
      setActiveId([...loaded].sort((a, b) => b.updatedAt - a.updatedAt)[0].id);
    } else {
      const first = createChat();
      setChats([first]);
      setActiveId(first.id);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveChats(chats);
  }, [chats, ready]);

  const handleUpdate = useCallback((id: string, messages: UIMessage[]) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, messages, title: titleFrom(messages), updatedAt: Date.now() } : c
      )
    );
  }, []);

  function handleNew() {
    setSidebarOpen(false);
    const current = chats.find((c) => c.id === activeId);
    if (current && current.messages.length === 0) return; // already on a blank chat
    const next = createChat();
    setChats((prev) => [next, ...prev]);
    setActiveId(next.id);
  }

  function handleSelect(id: string) {
    setActiveId(id);
    setSidebarOpen(false);
  }

  function handleDelete(id: string) {
    const remaining = chats.filter((c) => c.id !== id);
    if (remaining.length === 0) {
      const fresh = createChat();
      setChats([fresh]);
      setActiveId(fresh.id);
      return;
    }
    setChats(remaining);
    if (id === activeId) setActiveId(remaining[0].id);
  }

  if (!ready) return <div className="h-dvh bg-panel" />;

  const active = chats.find((c) => c.id === activeId);

  return (
    <div className="flex h-dvh bg-panel text-ink">
      <Sidebar
        chats={chats}
        activeId={activeId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        {active && (
          <ChatThread
            key={active.id}
            chat={active}
            onUpdate={handleUpdate}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        )}
      </main>
    </div>
  );
}