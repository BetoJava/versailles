import OpenAI from "openai";
import type { OnboardingData } from "~/contexts/onboarding-context";

// Types pour les activités
export interface Activity {
  id: string;
  name: string;
  description: string;
  reason: string;
  category: string;
  difficulty: string;
  duration: number;
  interests: Record<string, number>;
  latitude: number;
  longitude: number;
  openingTime: number;
  closingTime: number;
  sectionId: string;
  url: string;
}

export interface ScoredActivity extends Activity {
  score?: number;
}

interface LLMScoreResponse {
  id: string;
  score: number;
  reason?: string;
}

/**
 * Filtre les activités en fonction des conditions définies dans l'onboarding
 * Pour l'instant, ne filtre rien et retourne toutes les activités
 */
export function filterOnConditions(
  activities: Activity[],
  onboardingData: OnboardingData
): Activity[] {
  // Pour l'instant, on retourne toutes les activités sans filtrage
  // À implémenter plus tard selon les besoins métier
  console.log("Filtrage des activités (pas de filtre pour l'instant)");
  console.log("Données d'onboarding:", onboardingData);
  
  return activities;
}

/**
 * Traite les activités en parallèle avec l'API Mistral AI pour scorer chaque activité
 * Utilise le prompt processActivityByLLM.md
 */
export async function processByLLM(
  activities: Activity[],
  onboardingData: OnboardingData,
  weather: string = "Ensoleillé, 20°C"
): Promise<ScoredActivity[]> {
  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY n'est pas configurée dans les variables d'environnement");
  }

  // Configuration du client OpenAI avec l'URL de Mistral AI
  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.mistral.ai/v1",
  });

  // Préparer les informations du groupe
  const groupInformations = `
- Présence d'enfants : ${onboardingData.hasChildren ? "Oui" : "Non"}
- Niveau de marche souhaité : ${onboardingData.walkingLevel}/50 (${getWalkingLevelDescription(onboardingData.walkingLevel)})
- Besoins d'accessibilité :
  ${onboardingData.handicaps.mobilite ? "  - Mobilité réduite" : ""}
  ${onboardingData.handicaps.vision ? "  - Déficience visuelle" : ""}
  ${onboardingData.handicaps.audition ? "  - Déficience auditive" : ""}
  ${!onboardingData.handicaps.mobilite && !onboardingData.handicaps.vision && !onboardingData.handicaps.audition ? "  - Aucun besoin spécifique" : ""}
- Jours de visite : ${onboardingData.visitDays.length} jour(s)
  ${onboardingData.visitDays.map(day => `  - ${day.date} de ${day.startTime} à ${day.endTime}`).join("\n")}
`;

  const groupPreferences = onboardingData.preferences || "Aucune préférence spécifique indiquée";

  // Traiter les activités par batch de 5
  const batchSize = 5;
  const batches: Activity[][] = [];
  
  for (let i = 0; i < activities.length; i += batchSize) {
    batches.push(activities.slice(i, i + batchSize));
  }

  console.log(`Traitement de ${activities.length} activités en ${batches.length} batch(s)`);

  // Traiter tous les batches en parallèle
  const batchPromises = batches.map(async (batch) => {
    const activityBatch = JSON.stringify(batch.map(activity => ({
      id: activity.id,
      name: activity.name,
      description: activity.description,
      reason: activity.reason,
      category: activity.category,
      difficulty: activity.difficulty,
      duration: activity.duration,
      interests: activity.interests,
      openingTime: activity.openingTime,
      closingTime: activity.closingTime,
    })), null, 2);

    const prompt = buildPrompt(groupInformations, groupPreferences, weather, activityBatch);

    try {
      const completion = await client.chat.completions.create({
        model: "mistral-large-latest",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 5000,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        console.error("Pas de réponse du LLM pour ce batch");
        return batch.map(activity => ({ ...activity, score: 3 })); // Score par défaut
      }

      // Extraire le JSON de la réponse
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error("Impossible d'extraire le JSON de la réponse:", response);
        return batch.map(activity => ({ ...activity, score: 3 }));
      }

      const scores: LLMScoreResponse[] = JSON.parse(jsonMatch[0]);
      
      // Associer les scores aux activités
      return batch.map(activity => {
        const scoreData = scores.find(s => s.id === activity.id);
        return {
          ...activity,
          score: scoreData?.score ?? 3,
        };
      });
    } catch (error) {
      console.error("Erreur lors de l'appel à l'API Mistral:", error);
      // En cas d'erreur, retourner les activités avec un score par défaut
      return batch.map(activity => ({ ...activity, score: 3 }));
    }
  });

  // Attendre que tous les batches soient traités
  const scoredBatches = await Promise.all(batchPromises);
  const scoredActivities = scoredBatches.flat();

  // Filtrer les activités avec un score de 0
  const filteredActivities = scoredActivities.filter(activity => 
    activity.score !== undefined && activity.score > 0
  );

  console.log(`${scoredActivities.length - filteredActivities.length} activité(s) filtrée(s) avec un score de 0`);
  console.log(`${filteredActivities.length} activité(s) restante(s)`);

  return filteredActivities;
}

/**
 * Construit le prompt pour l'API Mistral AI
 */
function buildPrompt(
  groupInformations: string,
  groupPreferences: string,
  weather: string,
  activityBatch: string
): string {
  return `Tu es un expert des activités du chateau de versaille, et ton but est de fournir la meilleure experience visiteur.

# Objectif
Tu disposes :
- des informations du groupe de visite : s'il y a des enfant, s'ils souhaitent peu ou beaucoup marcher, leur besoin d'accessibilité (si demandé)
- des préférences de l'utilisateur sur sa visite
- de la météo
- d'un batch de 5 activités parmi les 5

Ton but est d'analyser ces activités par rapport aux autres information donner un score entre 0 et 5 qui définit l'intérêt de cette activité pour le groupe de visiteur, par rapport à leurs informations et leurs préférences. Si tu décides de ne pas proposer l'activité, met 0 et donne la raison de ce score. Si l'activité devrait être absolument proposée, met 5. 

# Ce que tu dois faire
1. Analyser les 5 activités par rapport aux autres informations
2. Pour chacune donner un score entre 0 et 5
3. Si le score donné est 0, donner la raison pour laquelle il ne faut pas proposer cette activité
4. Renvoyer un JSON avec les scores et raisons pour chaque activité du batch


# Exemple de réponse :
\`\`\`json
[
    {
        "id": "1",
        "score": 4
    },
    {
        "id": "2",
        "score": 0,
        "reason": "Le groupe a indiqué avoir déjà fait cette activité lors d'une précédente visite."
    }
]
\`\`\`


# Notes importantes
- Réponds toujours un JSON correctement formatté : liste d'objet avec "id", "score", et "reason" si le score est 0

---
# Informations du groupe de visiteur
${groupInformations}

---
# Préférences du groupe de visiteur
${groupPreferences}

---
# Météo
${weather}

---
# Batch d'activités à scorer
${activityBatch}`;
}

/**
 * Retourne une description textuelle du niveau de marche
 */
function getWalkingLevelDescription(level: number): string {
  if (level < 10) return "Très peu de marche";
  if (level < 20) return "Peu de marche";
  if (level < 30) return "Marche modérée";
  if (level < 40) return "Beaucoup de marche";
  return "Marche intensive";
}
