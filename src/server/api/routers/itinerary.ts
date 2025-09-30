import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { buildItinerary, type DistanceMatrix } from "~/lib/itinerary/itinerary-builder";
import { type Activity, type LikeDislike } from "~/lib/itinerary/content-based-interest";
import activitiesV2 from "~/assets/data/activity_v2.json";
import activityDistances from "~/assets/data/activity_distances.json";

const likeDislikeSchema = z.object({
  activityId: z.string(),
  like: z.boolean(),
});

const buildItineraryInputSchema = z.object({
  likesDislikes: z.array(likeDislikeSchema),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  walkSpeed: z.number().min(0).max(100).default(50),
  maxActivities: z.number().min(1).max(20).default(10),
  alpha: z.number().default(1.0),
  beta: z.number().default(0.8),
  gamma: z.number().default(0.5),
  delta: z.number().default(0.2),
  epsilon: z.number().default(1.5),
});

const ALL_ACTIVITIES = activitiesV2 as Activity[];
const DISTANCES = activityDistances as DistanceMatrix;

export const itineraryRouter = createTRPCRouter({
  buildItinerary: publicProcedure
    .input(buildItineraryInputSchema)
    .mutation(async ({ input }) => {
      console.log("Building itinerary with input:", input);

      const result = buildItinerary(
        input.likesDislikes,
        ALL_ACTIVITIES,
        DISTANCES,
        input.startTime,
        input.endTime,
        input.walkSpeed,
        "La Statue de Louis XIV",
        input.maxActivities,
        input.alpha,
        input.beta,
        input.gamma,
        input.delta,
        input.epsilon
      );

      console.log(`Itinerary built: ${result.total_activities} activities`);

      return {
        success: true,
        itinerary: result,
      };
    }),

  getDistanceMatrix: publicProcedure
    .query(() => {
      return DISTANCES;
    }),
});
