import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

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

// Simulation d'activités (sera remplacée par une vraie base de données)
const ACTIVITIES_DB = [
  { id: "1", name: "Visite des Grands Appartements", category: "architecture", difficulty: "easy", duration: 60 },
  { id: "2", name: "Jardins de Versailles", category: "nature", difficulty: "medium", duration: 90 },
  { id: "3", name: "Galerie des Glaces", category: "architecture", difficulty: "easy", duration: 45 },
  { id: "4", name: "Chapelle Royale", category: "religion", difficulty: "easy", duration: 30 },
  { id: "5", name: "Opéra Royal", category: "culture", difficulty: "medium", duration: 60 },
  { id: "6", name: "Petit Trianon", category: "architecture", difficulty: "medium", duration: 75 },
  { id: "7", name: "Grand Trianon", category: "architecture", difficulty: "medium", duration: 90 },
  { id: "8", name: "Hameau de la Reine", category: "nature", difficulty: "easy", duration: 45 },
  { id: "9", name: "Musée de l'Histoire de France", category: "culture", difficulty: "hard", duration: 120 },
  { id: "10", name: "Appartements de Mesdames", category: "architecture", difficulty: "easy", duration: 30 },
  { id: "11", name: "Salle des Gardes", category: "architecture", difficulty: "easy", duration: 20 },
  { id: "12", name: "Escalier des Ambassadeurs", category: "architecture", difficulty: "medium", duration: 30 },
  { id: "13", name: "Salle du Trône", category: "architecture", difficulty: "easy", duration: 25 },
  { id: "14", name: "Chambre du Roi", category: "architecture", difficulty: "easy", duration: 35 },
  { id: "15", name: "Salon de la Guerre", category: "architecture", difficulty: "easy", duration: 20 },
  { id: "16", name: "Salon de la Paix", category: "architecture", difficulty: "easy", duration: 20 },
  { id: "17", name: "Galerie des Batailles", category: "culture", difficulty: "hard", duration: 90 },
  { id: "18", name: "Appartements de l'Empereur", category: "architecture", difficulty: "medium", duration: 60 },
  { id: "19", name: "Salle des Machines", category: "culture", difficulty: "medium", duration: 45 },
  { id: "20", name: "Orangerie", category: "nature", difficulty: "easy", duration: 30 },
];

export const onboardingRouter = createTRPCRouter({
  processOnboarding: publicProcedure
    .input(onboardingDataSchema)
    .mutation(async ({ input }) => {
      // Simulation d'un algorithme de sélection d'activités
      // Plus tard, ceci sera remplacé par une vraie logique métier
      
      let selectedActivities = [...ACTIVITIES_DB];
      
      // Filtrage basé sur les handicaps
      if (input.handicaps.mobilite) {
        // Privilégier les activités avec peu de marche
        selectedActivities = selectedActivities.filter(activity => 
          activity.difficulty === "easy" || activity.difficulty === "medium"
        );
      }
      
      // Filtrage basé sur le niveau de marche
      if (input.walkingLevel < 17) {
        // Peu de marche - activités courtes et faciles
        selectedActivities = selectedActivities.filter(activity => 
          activity.difficulty === "easy" && activity.duration <= 60
        );
      } else if (input.walkingLevel > 33) {
        // Beaucoup de marche - activités plus longues
        selectedActivities = selectedActivities.filter(activity => 
          activity.duration >= 60
        );
      }
      
      // Filtrage basé sur la présence d'enfants
      if (input.hasChildren) {
        // Privilégier les activités adaptées aux enfants
        selectedActivities = selectedActivities.filter(activity => 
          activity.difficulty === "easy" && activity.duration <= 90
        );
      }
      
      // Filtrage basé sur les préférences (mots-clés simples)
      const preferences = input.preferences.toLowerCase();
      if (preferences.includes("jardin") || preferences.includes("nature")) {
        selectedActivities = selectedActivities.filter(activity => 
          activity.category === "nature"
        );
      }
      if (preferences.includes("histoire") || preferences.includes("culture")) {
        selectedActivities = selectedActivities.filter(activity => 
          activity.category === "culture" || activity.category === "architecture"
        );
      }
      
      // Sélectionner 15 activités maximum
      const shuffled = selectedActivities.sort(() => 0.5 - Math.random());
      const finalSelection = shuffled.slice(0, 15);
      
      // Retourner les IDs des activités sélectionnées
      return {
        success: true,
        activityIds: finalSelection.map(activity => activity.id),
        totalActivities: finalSelection.length,
        metadata: {
          hasChildren: input.hasChildren,
          walkingLevel: input.walkingLevel,
          handicaps: input.handicaps,
          visitDays: input.visitDays.length,
          preferences: input.preferences,
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
