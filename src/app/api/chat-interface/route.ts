import { NextRequest } from "next/server";
import OpenAI from "openai";
import activitiesData from "~/assets/data/activity_v2.json";
import businessData from "~/assets/business_v2.json";

// Configuration du client OpenAI avec l'URL de Mistral AI
const client = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: "https://api.mistral.ai/v1",
});

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!process.env.MISTRAL_API_KEY) {
      throw new Error("MISTRAL_API_KEY n'est pas configurée");
    }

    if (!message || message.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Le message ne peut pas être vide" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  // // Construire le prompt avec les données
  // const systemPrompt = buildSystemPrompt(activitiesData, businessData);
      
  // // Construire l'historique des messages pour Mistral
  // const messages = [
  //   {
  //     role: "system" as const,
  //     content: systemPrompt,
  //   },
  //   ...conversationHistory.map((msg: any) => ({
  //     role: msg.role as "user" | "assistant",
  //     content: cleanString(msg.content),
  //   })),
  //   {
  //     role: "user" as const,
  //     content: cleanString(message),
  //   },
  // ];

    // Message d'obstruction à streamer
    const obstructionMessage = "Déployez l'application avec votre clé API Mistral AI pour utiliser la fonctionnalité de chat. Pour plus d'info : https://github.com/BetoJava/versailles";

    // Créer un encoder de texte pour le streaming
    const encoder = new TextEncoder();

    // Créer un ReadableStream pour le streaming
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // // Appel à Mistral AI avec streaming
          // const completion = await client.chat.completions.create({
          //   model: "mistral-large-latest",
          //   messages: messages,
          //   temperature: 0.7,
          //   max_tokens: 10000,
          //   stream: true,
          // });

          // // Streamer les chunks
          // for await (const chunk of completion) {
          //   const content = chunk.choices[0]?.delta?.content;
            
          //   if (content) {
          //     const data = JSON.stringify({ content });
          //     controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          //   }
          // Diviser le message en mots pour simuler un streaming naturel
          const words = obstructionMessage.split(' ');
          
          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const data = JSON.stringify({ content: i === 0 ? word : ` ${word}` });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            
            // Ajouter un petit délai pour simuler le streaming
            await new Promise(resolve => setTimeout(resolve, 50));
          }

          // Envoyer le signal de fin
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Erreur streaming:", error);
          const errorMessage = JSON.stringify({
            error: error instanceof Error ? error.message : "Erreur inconnue",
          });
          controller.enqueue(encoder.encode(`data: ${errorMessage}\n\n`));
          controller.close();
        }
      },
    });

    // Retourner la réponse avec les headers appropriés pour le streaming
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Erreur API chat:", error);
    return new Response(
      JSON.stringify({
        error: "Erreur interne du serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Nettoie une chaîne de caractères en supprimant les caractères de contrôle
 * et en échappant les caractères spéciaux JSON
 */
function cleanString(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Supprime les caractères de contrôle
    .replace(/\r\n/g, '\n') // Normalise les retours à la ligne
    .replace(/\r/g, '\n') // Normalise les retours chariot
    .trim();
}

/**
 * Convertit de manière sûre un objet en JSON pour l'inclure dans un prompt
 */
function safeJsonStringify(obj: any): string {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'string') {
      return cleanString(value);
    }
    return value;
  }, 2);
}

/**
 * Construit le prompt système pour l'agent chatbot
 */
function buildSystemPrompt(
  activities: typeof activitiesData,
  businesses: typeof businessData
): string {
  // Formater les activités de manière concise en nettoyant les chaînes
  const activitiesFormatted = activities.map(activity => ({
    id: activity.activityId,
    name: cleanString(activity.name),
    description: cleanString(activity.catchy_description || activity.reason || ""),
    duration: activity.duration,
    openingTime: activity.openingTime,
    closingTime: activity.closingTime,
    url: cleanString(activity.url),
    interests: {
      architecture: activity["interests.architecture"],
      landscape: activity["interests.landscape"],
      politic: activity["interests.politic"],
      history: activity["interests.history"],
      courtlife: activity["interests.courtlife"],
      art: activity["interests.art"],
      engineering: activity["interests.engineering"],
      spirituality: activity["interests.spirituality"],
      nature: activity["interests.nature"],
    }
  }));

  const businessFormatted = businesses.map(business => ({
    id: business.businessId,
    name: cleanString(business.name),
    type: cleanString(business.type),
    openingTime: business.openingTime,
    closingTime: business.closingTime,
    price: business.price,
    phone: cleanString(business.phone),
    url: cleanString(business.url),
  }));

  return `Tu es un expert du Château de Versailles et ton but est de fournir la meilleure expérience visiteur.

# Ton rôle
Tu es un assistant conversationnel qui aide les visiteurs du Château de Versailles à :
- Découvrir les activités et lieux disponibles
- Obtenir des informations sur les horaires, tarifs et services
- Comprendre l'histoire et les particularités du château
- Planifier leur visite

# Données disponibles

## Activités disponibles (${activities.length} activités) :
${safeJsonStringify(activitiesFormatted)}

## Services et commerces disponibles (${businesses.length} établissements) :
${safeJsonStringify(businessFormatted)}

# Instructions importantes
1. Sois précis, informatif et amical dans tes réponses
2. Utilise les données fournies pour répondre aux questions sur les activités et services
3. Si tu recommandes des activités, cite leur nom exact et donne des détails pertinents (durée, horaires, description)
4. Si tu ne trouves pas d'information pertinente dans les données, dis-le clairement
5. N'hésite pas à proposer un passage en boutique
6. Propose une visite guidée par journée si possible, et pas plus
7. Réponds de manière conversationnelle et naturelle, en français`;
}
