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

// Import des activités complètes et des infos de swipe
import activitiesV2 from "~/assets/data/activity_v2_clean.json"
import swipeInfoClean from "~/assets/data/activity_swipe_info_clean.json"

// Préparer les activités de activity_v2_clean.json
const ALL_ACTIVITIES = activitiesV2.map(activity => ({
  id: activity.activityId,
  name: activity.name,
  description: activity.catchy_description || "",
  reason: activity.reason || "Une expérience unique vous attend dans ce lieu exceptionnel.",
  duration: Math.round(activity.duration * 60), // Convertir en minutes
  interests: {
    architecture: activity["interests.architecture"] ?? 0,
    landscape: activity["interests.landscape"] ?? 0,
    politic: activity["interests.politic"] ?? 0,
    history: activity["interests.history"] ?? 0,
    courtlife: activity["interests.courtlife"] ?? 0,
    art: activity["interests.art"] ?? 0,
    engineering: activity["interests.engineering"] ?? 0,
    spirituality: activity["interests.spirituality"] ?? 0,
    nature: activity["interests.nature"] ?? 0,
  },
  latitude: activity.latitude,
  longitude: activity.longitude,
  openingTime: activity.openingTime,
  closingTime: activity.closingTime,
  sectionId: activity.sectionId,
  url: activity.url
})) as Activity[]


export const onboardingRouter = createTRPCRouter({
  processOnboarding: publicProcedure
    .input(onboardingDataSchema)
    .mutation(async ({ input }) => {
      console.log("Données d'onboarding reçues:", input);
      
      // Étape 1 : Filtrer les activités selon les conditions
      const filteredActivities = filterOnConditions(ALL_ACTIVITIES, input);
      console.log(`${filteredActivities.length} activités après filtrage sur conditions`);
      
      // Étape 2 : Traiter les activités avec le LLM pour obtenir les scores
      const scoredActivities = await processByLLM(filteredActivities, input);
      console.log(`${scoredActivities.length} activités après traitement LLM`);
      
      // Calculer les IDs retirés
      const allActivityIds = new Set(ALL_ACTIVITIES.map(a => a.id));
      const scoredActivityIds = new Set(scoredActivities.map(a => a.id));
      const removedActivityIds = Array.from(allActivityIds).filter(id => !scoredActivityIds.has(id));
      
      console.log(`${removedActivityIds.length} activités retirées au total`);
      
      // Filtrer activity_swipe_info_clean.json pour ne garder que les activités non retirées
      const swipeActivities = swipeInfoClean
        .filter(swipeInfo => !removedActivityIds.includes(swipeInfo.activityId))
        .map(swipeInfo => ({
          activityId: swipeInfo.activityId,
          name: swipeInfo.name,
          catchy_description: swipeInfo.catchy_description,
          reason: swipeInfo.reason,
        }));
      
      console.log(`${swipeActivities.length} activités disponibles pour le swipe`);
      
      return {
        success: true,
        activityIds: scoredActivities.map(activity => activity.id),
        removedActivityIds,
        swipeActivities,
        totalActivities: scoredActivities.length,
        metadata: {
          hasChildren: input.hasChildren,
          walkingLevel: input.walkingLevel,
          handicaps: input.handicaps,
          visitDays: input.visitDays.length,
          preferences: input.preferences,
          originalCount: ALL_ACTIVITIES.length,
          filteredCount: filteredActivities.length,
          finalCount: scoredActivities.length,
          removedCount: removedActivityIds.length,
        }
      };
    }),

  // Procédure pour récupérer les détails d'une activité par son ID
  getActivityDetails: publicProcedure
    .input(z.object({ activityId: z.string() }))
    .query(async ({ input }) => {
      const activity = ALL_ACTIVITIES.find(a => a.id === input.activityId);
      if (!activity) {
        throw new Error("Activité non trouvée");
      }
      return activity;
    }),

  // Procédure pour récupérer toutes les activités (pour debug)
  getAllActivities: publicProcedure
    .query(async () => {
      return ALL_ACTIVITIES;
    }),
});
