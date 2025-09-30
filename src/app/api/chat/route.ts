import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import activitiesData from "~/assets/data/activity_v2.json";
import businessData from "~/assets/business.json";

// Configuration du client OpenAI avec l'URL de Mistral AI
const client = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: "https://api.mistral.ai/v1",
});

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!process.env.MISTRAL_API_KEY) {
      throw new Error("MISTRAL_API_KEY n'est pas configurée");
    }

    if (!question || question.trim() === "") {
      return NextResponse.json(
        { error: "La question ne peut pas être vide" },
        { status: 400 }
      );
    }

    // Construire le prompt avec les données
    const prompt = buildChatPrompt(question, activitiesData, businessData);

    // Appel à Mistral AI
    const completion = await client.chat.completions.create({
      model: "mistral-large-latest",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 10000,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error("Pas de réponse du LLM");
    }

    // Extraire le JSON de la réponse
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch || !jsonMatch[1]) {
      // Si pas de bloc json, essayer de parser directement
      try {
        const parsedResponse = JSON.parse(response);
        return NextResponse.json(parsedResponse);
      } catch {
        // Si ça échoue, retourner la réponse brute dans answer
        return NextResponse.json({ answer: response });
      }
    }

    // Nettoyer et parser le JSON
    const cleanedJson = jsonMatch[1].replace(/,(\s*[}\]])/g, '$1');
    const parsedResponse = JSON.parse(cleanedJson);

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("Erreur API chat:", error);
    return NextResponse.json(
      { 
        error: "Erreur interne du serveur", 
        details: error instanceof Error ? error.message : "Erreur inconnue" 
      },
      { status: 500 }
    );
  }
}

/**
 * Construit le prompt pour l'agent chatbot
 */
function buildChatPrompt(
  question: string,
  activities: typeof activitiesData,
  businesses: typeof businessData
): string {
  // Formater les activités de manière concise
  const activitiesFormatted = activities.map(activity => ({
    id: activity.activityId,
    name: activity.name,
    description: activity.catchy_description || activity.reason || "",
    duration: activity.duration,
    openingTime: activity.openingTime,
    closingTime: activity.closingTime,
    url: activity.url,
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
    name: business.name,
    type: business.type,
    openingTime: business.openingTime,
    closingTime: business.closingTime,
    price: business.price,
    phone: business.phone,
    url: business.url,
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
${JSON.stringify(activitiesFormatted, null, 2)}

## Services et commerces disponibles (${businesses.length} établissements) :
${JSON.stringify(businessFormatted, null, 2)}

# Instructions importantes
1. Réponds toujours en JSON avec au minimum une clé "answer" contenant ta réponse en français
2. Sois précis, informatif et amical dans tes réponses
3. Utilise les données fournies pour répondre aux questions sur les activités et services
4. Si tu recommandes des activités, cite leur nom exact et donne des détails pertinents (durée, horaires, description)
5. Si tu ne trouves pas d'information pertinente dans les données, dis-le clairement

# Format de réponse
Réponds TOUJOURS dans ce format JSON :
\`\`\`json
{
  "answer": "Ta réponse complète et détaillée ici"
}
\`\`\`

# Question du visiteur
${question}`;
}
