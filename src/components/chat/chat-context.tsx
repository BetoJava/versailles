"use client";

import React, { createContext, useContext, useReducer, type ReactNode } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  attachments?: Array<{
    type: "image";
    url: string;
    name: string;
  }>;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentStreamingMessageId?: string;
}

type ChatAction =
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "UPDATE_MESSAGE"; payload: { id: string; content: string } }
  | { type: "START_STREAMING"; payload: { id: string } }
  | { type: "STOP_STREAMING"; payload: { id: string } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "CLEAR_MESSAGES" };

const initialState: ChatState = {
  messages: [],
  isLoading: false,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.id
            ? { ...msg, content: action.payload.content }
            : msg,
        ),
      };
    case "START_STREAMING":
      return {
        ...state,
        currentStreamingMessageId: action.payload.id,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.id ? { ...msg, isStreaming: true } : msg,
        ),
      };
    case "STOP_STREAMING":
      return {
        ...state,
        currentStreamingMessageId: undefined,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.id ? { ...msg, isStreaming: false } : msg,
        ),
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "CLEAR_MESSAGES":
      return {
        ...state,
        messages: [],
        currentStreamingMessageId: undefined,
      };
    default:
      return state;
  }
}

interface ChatContextType {
  state: ChatState;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => string;
  updateMessage: (id: string, content: string) => void;
  startStreaming: (id: string) => void;
  stopStreaming: (id: string) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  sendMessage: (content: string, attachments?: Message["attachments"]) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const addMessage = (message: Omit<Message, "id" | "timestamp">): string => {
    const id = Math.random().toString(36).substr(2, 9);
    const newMessage: Message = {
      ...message,
      id,
      timestamp: new Date(),
    };
    dispatch({ type: "ADD_MESSAGE", payload: newMessage });
    return id;
  };

  const updateMessage = (id: string, content: string) => {
    dispatch({ type: "UPDATE_MESSAGE", payload: { id, content } });
  };

  const startStreaming = (id: string) => {
    dispatch({ type: "START_STREAMING", payload: { id } });
  };

  const stopStreaming = (id: string) => {
    dispatch({ type: "STOP_STREAMING", payload: { id } });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  };

  const clearMessages = () => {
    dispatch({ type: "CLEAR_MESSAGES" });
  };

  const sendMessage = async (content: string, attachments?: Message["attachments"]) => {
    // Ajouter le message utilisateur
    addMessage({
      role: "user",
      content,
      attachments,
    });

    // Créer le message assistant en streaming
    const assistantMessageId = addMessage({
      role: "assistant",
      content: "",
      isStreaming: true,
    });

    startStreaming(assistantMessageId);
    setLoading(true);

    try {
      // Préparer l'historique de la conversation pour Mistral
      const conversationHistory = state.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        attachments: msg.attachments,
      }));

      // Appel API avec streaming
      const response = await fetch("/api/chat-interface", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          attachments,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Impossible de lire la réponse");
      }

      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              // Fin du streaming
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedContent += parsed.content;
                updateMessage(assistantMessageId, accumulatedContent);
              }
            } catch (e) {
              // Ignorer les erreurs de parsing JSON
              console.warn("Erreur parsing JSON:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      updateMessage(assistantMessageId, "Désolé, une erreur s'est produite lors de la communication avec Mistral AI. Vérifiez votre configuration.");
    } finally {
      stopStreaming(assistantMessageId);
      setLoading(false);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        state,
        addMessage,
        updateMessage,
        startStreaming,
        stopStreaming,
        setLoading,
        clearMessages,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

