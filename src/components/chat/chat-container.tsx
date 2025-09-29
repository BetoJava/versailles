"use client";

import { useChat } from "./chat-context";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { MessageSuggestions } from "./message-suggestions";

export function ChatContainer() {
  const { state } = useChat();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden w-3xl mx-auto">
        <MessageList messages={state.messages} isLoading={state.isLoading} />
      </div>
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-4 max-w-3xl mx-auto">
          {state.messages.length === 0 && <MessageSuggestions />}
          <ChatInput />
        </div>
      </div>
    </div>
  );
}
