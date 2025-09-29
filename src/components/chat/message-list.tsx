"use client";

import { useEffect, useRef } from "react";
import { type Message } from "./chat-context";
import { MessageBubble } from "./message-bubble";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  emptyChild?: React.ReactNode;
}

const defaultEmptyChild = (
  <div className="flex h-full items-center justify-center">
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-muted-foreground">
        Commencez une conversation
      </h2>
      <p className="mt-2 text-muted-foreground">
        Posez une question ou utilisez une des suggestions ci-dessous
      </p>
    </div>
  </div>
);

export function MessageList({ messages, isLoading, emptyChild = defaultEmptyChild }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      emptyChild
    );
  }

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto px-4 py-6"
    >
      <div className="container max-w-4xl space-y-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 rounded-lg bg-muted px-4 py-2">
              <div className="flex space-x-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
