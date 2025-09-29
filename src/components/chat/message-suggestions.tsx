"use client";

import { useChat } from "./chat-context";
import { Button } from "~/components/ui/button";
import { MessageCircle, Code, Lightbulb, HelpCircle } from "lucide-react";

const suggestions = [
  {
    icon: MessageCircle,
    title: "Conversation générale",
    message: "Bonjour ! Comment allez-vous aujourd'hui ?",
    description: "Commencer une conversation amicale",
  },
  {
    icon: Code,
    title: "Aide au développement",
    message: "Peux-tu m'aider à résoudre un problème de code ?",
    description: "Obtenir de l'aide pour programmer",
  },
  {
    icon: Lightbulb,
    title: "Brainstorming",
    message: "J'ai besoin d'idées créatives pour mon projet",
    description: "Générer des idées innovantes",
  },
  {
    icon: HelpCircle,
    title: "Explication",
    message: "Peux-tu m'expliquer un concept complexe ?",
    description: "Comprendre des sujets difficiles",
  },
];

export function MessageSuggestions() {
  const { sendMessage, state } = useChat();

  const handleSuggestionClick = async (message: string) => {
    if (state.isLoading) return;
    await sendMessage(message);
  };

  return (
    <div className="mb-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">
        Suggestions pour commencer
      </h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <Button
              key={index}
              variant="outline"
              className="h-auto justify-start p-4 text-left"
              onClick={() => handleSuggestionClick(suggestion.message)}
              disabled={state.isLoading}
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{suggestion.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {suggestion.description}
                  </p>
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
