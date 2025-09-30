import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { filterOnConditions, processByLLM, type Activity } from "~/lib/activity-processing";

// Schémas de validation pour les données d'onboarding
const handicapsSchema = z.object({
  mobilite: z.boolean(),
  vision: z.boolean(),
  audition: z.boolean(),
});

const visitDaySchema = z.object({
  id: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

const onboardingDataSchema = z.object({
  hasChildren: z.boolean(),
  walkingLevel: z.number().min(0).max(50),
  handicaps: handicapsSchema,
  visitDays: z.array(visitDaySchema),
  preferences: z.string(),
});

// Import des vraies activités depuis le fichier JSON
import activitiesData from "~/assets/activity.json"

// Liste des IDs d'activités sélectionnées
const SELECTED_ACTIVITY_IDS = [
  "12", "5", "43", "15", "3", "46", "36", "11", "18", "6", 
  "1", "16", "8", "63", "34", "25", "42", "57", "30"
]

// Filtrer les activités selon les IDs sélectionnés
const ACTIVITIES_DB = activitiesData.filter(activity => 
  SELECTED_ACTIVITY_IDS.includes(activity.activityId)
).map(activity => ({
  id: activity.activityId,
  name: activity.display_name || activity.name,
  description: activity.catchy_description || "",
  reason: activity.reason || "Une expérience unique vous attend dans ce lieu exceptionnel.",
  category: getCategoryFromInterests(activity.interests),
  difficulty: getDifficultyFromDuration(activity.duration),
  duration: Math.round(activity.duration * 60), // Convertir en minutes
  interests: activity.interests,
  latitude: activity.latitude,
  longitude: activity.longitude,
  openingTime: activity.openingTime,
  closingTime: activity.closingTime,
  sectionId: activity.sectionId,
  url: activity.url
}))

// Fonction pour déterminer la catégorie basée sur les intérêts
function getCategoryFromInterests(interests: Record<string, number>): string {
  const maxInterest = Object.entries(interests).reduce((max, [key, value]) => 
    (value as number) > max.value ? { key, value: value as number } : max, 
    { key: "architecture", value: 0 }
  )
  
  switch (maxInterest.key) {
    case "landscape":
    case "nature":
      return "nature"
    case "art":
    case "spirituality":
      return "culture"
    case "politic":
    case "history":
    case "courtlife":
      return "architecture"
    default:
      return "architecture"
  }
}

// Fonction pour déterminer la difficulté basée sur la durée
function getDifficultyFromDuration(duration: number): string {
  if (duration <= 1) return "easy"
  if (duration <= 2) return "medium"
  return "hard"
}

export const onboardingRouter = createTRPCRouter({
  processOnboarding: publicProcedure
    .input(onboardingDataSchema)
    .mutation(async ({ input }) => {
      console.log("Données d'onboarding reçues:", input);
      
      // Étape 1 : Filtrer les activités selon les conditions
      const filteredActivities = filterOnConditions(ACTIVITIES_DB as Activity[], input);
      console.log(`${filteredActivities.length} activités après filtrage sur conditions`);
      
      // Étape 2 : Traiter les activités avec le LLM pour obtenir les scores
      const scoredActivities = await processByLLM(filteredActivities, input);
      console.log(`${scoredActivities.length} activités après traitement LLM`);
      
      return {
        success: true,
        activityIds: scoredActivities.map(activity => activity.id),
        totalActivities: scoredActivities.length,
        metadata: {
          hasChildren: input.hasChildren,
          walkingLevel: input.walkingLevel,
          handicaps: input.handicaps,
          visitDays: input.visitDays.length,
          preferences: input.preferences,
          originalCount: ACTIVITIES_DB.length,
          filteredCount: filteredActivities.length,
          finalCount: scoredActivities.length,
        }
      };
    }),

  // Procédure pour récupérer les détails d'une activité par son ID
  getActivityDetails: publicProcedure
    .input(z.object({ activityId: z.string() }))
    .query(async ({ input }) => {
      const activity = ACTIVITIES_DB.find(a => a.id === input.activityId);
      if (!activity) {
        throw new Error("Activité non trouvée");
      }
      return activity;
    }),

  // Procédure pour récupérer toutes les activités (pour debug)
  getAllActivities: publicProcedure
    .query(async () => {
      return ACTIVITIES_DB;
    }),
});
