import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  attachments: z.array(z.object({
    type: z.literal("image"),
    url: z.string(),
    name: z.string(),
  })).optional(),
});

export const chatbotRouter = createTRPCRouter({
  // Procédure pour valider et préparer les données avant le streaming
  prepareMessage: publicProcedure
    .input(z.object({
      message: z.string(),
      attachments: z.array(z.object({
        type: z.literal("image"),
        url: z.string(),
        name: z.string(),
      })).optional(),
      conversationHistory: z.array(messageSchema).optional().default([]),
    }))
    .mutation(async ({ input }) => {
      // Validation et préparation des données
      return {
        success: true,
        data: {
          message: input.message,
          attachments: input.attachments,
          conversationHistory: input.conversationHistory,
        },
      };
    }),

  // Procédure pour obtenir une réponse simple (non-streaming) - pour les tests
  getResponse: publicProcedure
    .input(z.object({
      message: z.string(),
      attachments: z.array(z.object({
        type: z.literal("image"),
        url: z.string(),
        name: z.string(),
      })).optional(),
      conversationHistory: z.array(messageSchema).optional().default([]),
    }))
    .mutation(async ({ input }) => {
      // Cette procédure sera utilisée par l'API route pour le streaming
      return {
        message: input.message,
        attachments: input.attachments,
        conversationHistory: input.conversationHistory,
      };
    }),
});
