"use client";

import { useChat } from "./chat-context";
import { Button } from "~/components/ui/button";
import { MapPin, Clock, Utensils, Camera, Crown, History } from "lucide-react";

const suggestions = [
  {
    icon: MapPin,
    title: "Planifier ma visite",
    message: "Quelles sont les activités incontournables à voir au Château de Versailles ?",
    description: "Découvrir les lieux essentiels",
  },
  {
    icon: Camera,
    title: "Visite photo",
    message: "Quels sont les plus beaux endroits pour prendre des photos ?",
    description: "Capturer les meilleurs moments",
  },
  {
    icon: Crown,
    title: "Histoire royale",
    message: "Peux-tu me raconter l'histoire de Louis XIV et de la cour ?",
    description: "Découvrir l'histoire fascinante",
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
