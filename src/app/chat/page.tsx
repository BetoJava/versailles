"use client";

import { ChatProvider } from "~/components/chat/chat-context";
import { ChatContainer } from "~/components/chat/chat-container";
import { ModeToggle } from "~/components/ui/mode-toggle";

export default function ChatPage() {
  return (
    <ChatProvider>
      <div className="flex h-screen flex-col">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 px-8 items-center justify-between">
            <h1 className="text-lg font-semibold">Chat Assistant</h1>
            <ModeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-hidden w-full">
          <ChatContainer />
        </main>
      </div>
    </ChatProvider>
  );
}
