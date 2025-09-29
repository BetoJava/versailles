"use client";

import { useState, useRef } from "react";
import { useChat } from "./chat-context";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Send, Paperclip, Image, X } from "lucide-react";
import { cn } from "~/lib/utils";

export function ChatInput() {
  const { sendMessage, state } = useChat();
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Array<{
    type: "image";
    url: string;
    name: string;
    file: File;
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() && attachments.length === 0) return;
    if (state.isLoading) return;

    const messageAttachments = attachments.map(({ url, name, type }) => ({
      type,
      url,
      name,
    }));

    // Vider l'input immédiatement
    const messageContent = input.trim();
    setInput("");
    setAttachments([]);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Envoyer le message
    await sendMessage(messageContent, messageAttachments);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setAttachments((prev) => [
          ...prev,
          {
            type: "image",
            url,
            name: file.name,
            file,
          },
        ]);
      }
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const newAttachments = [...prev];
      // Nettoyer l'URL object
      URL.revokeObjectURL(newAttachments[index].url);
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Aperçu des pièces jointes */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="relative rounded-lg border bg-muted p-2"
            >
              <img
                src={attachment.url}
                alt={attachment.name}
                className="h-16 w-16 rounded object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0"
                onClick={() => removeAttachment(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              <p className="mt-1 text-xs text-muted-foreground truncate max-w-16">
                {attachment.name}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Zone de saisie */}
      <div className="relative flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tapez votre message..."
            className={cn(
              "min-h-[44px] resize-none pr-12",
              "focus-visible:ring-1 focus-visible:ring-ring"
            )}
            style={{ height: "44px" }}
          />
          
          {/* Bouton d'ajout de fichiers */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bouton d'envoi */}
        <Button
          type="submit"
          size="sm"
          disabled={(!input.trim() && attachments.length === 0) || state.isLoading}
          className="h-11 w-11 p-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </form>
  );
}
