"use client";

import { type Message } from "./chat-context";
import { MarkdownRenderer } from "./markdown-renderer";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { User, Bot } from "lucide-react";
import { cn } from "~/lib/utils";

interface MessageBubbleProps {
    message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === "user";

    return (
        <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
            {isUser && (
                <Avatar className="h-8 w-8">
                    <AvatarFallback>
                        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                </Avatar>
            )}
            <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
                <div
                    className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2",
                        isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                    )}
                >
                    {/* Affichage des pièces jointes */}
                    {message.attachments && message.attachments.length > 0 && (
                        <div className="mb-2 space-y-2">
                            {message.attachments.map((attachment, index) => (
                                <div key={index} className="rounded-md border bg-background/50 p-2">
                                    {attachment.type === "image" && (
                                        <img
                                            src={attachment.url}
                                            alt={attachment.name}
                                            className="max-h-48 rounded-md object-contain"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Contenu du message */}
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                        {isUser ? (
                            <p className="m-0 pr-4 whitespace-pre-wrap">{message.content}</p>
                        ) : (
                            <div className="text-foreground">
                                <MarkdownRenderer content={message.content} />
                            </div>
                        )}
                    </div>

                    {/* Indicateur de streaming */}
                    {message.isStreaming && (
                        <div className="mt-1 flex items-center space-x-1">
                            <div className="h-1 w-1 animate-pulse rounded-full bg-current opacity-60"></div>
                            <div className="h-1 w-1 animate-pulse rounded-full bg-current opacity-60 [animation-delay:0.2s]"></div>
                            <div className="h-1 w-1 animate-pulse rounded-full bg-current opacity-60 [animation-delay:0.4s]"></div>
                        </div>
                    )}
                </div>

                <span className="mt-1 text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
            </div>
        </div>
    );
}
