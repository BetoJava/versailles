import {
  type Activity,
  type LikeDislike,
  extractInterestVector,
  cosineSimilarity,
  recommendActivities,
} from "./content-based-interest";

export interface DistanceMatrix {
  [activityName: string]: {
    [targetName: string]: number;
  };
}

export interface ItineraryStep {
  order: number;
  activity_id?: string;
  activity_name: string;
  arrival_time: string;
  departure_time: string;
  duration: number;
  waiting_time: number;
  travel_time_from_previous: number;
  composite_score?: number;
  recommendation_score?: number;
}

export interface Itinerary {
  departure_time: string;
  arrival_time: string;
  total_duration: number;
  total_activities: number;
  itinerary: ItineraryStep[];
  stats: {
    total_travel_time: number;
    total_visit_time: number;
    total_waiting_time: number;
  };
}

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

function applyWalkSpeed(distances: DistanceMatrix, walkSpeed: number): DistanceMatrix {
  const coefficient = Math.min(0.2, walkSpeed / 100);
  const speedMultiplier = 1 + coefficient;
  
  const adjusted: DistanceMatrix = {};
  for (const [from, targets] of Object.entries(distances)) {
    adjusted[from] = {};
    for (const [to, time] of Object.entries(targets)) {
      adjusted[from]![to] = time / speedMultiplier;
    }
  }
  return adjusted;
}

function isActivityFeasible(
  activity: Activity,
  currentTime: number,
  endTime: number,
  currentLocation: string,
  distances: DistanceMatrix,
  returnPoint = "La Statue de Louis XIV"
): boolean {
  const travelTime = distances[currentLocation]?.[activity.name] ?? 0;
  const arrivalTime = currentTime + travelTime;

  const openingTime = activity.openingTime * 60;
  const closingTime = activity.closingTime * 60;
  const duration = activity.duration * 60;

  const actualStart = Math.max(arrivalTime, openingTime);
  if (actualStart >= closingTime) return false;

  const finishTime = actualStart + duration;
  if (finishTime > closingTime) return false;

  const returnTime = distances[activity.name]?.[returnPoint] ?? 0;
  if (finishTime + returnTime > endTime) return false;

  return true;
}

function calculateCompositeScore(
  activity: Activity & { recommendation_score: number },
  currentTime: number,
  currentLocation: string,
  cumulativeVector: number[],
  distances: DistanceMatrix,
  alpha = 1.0,
  beta = 0.4,
  gamma = 0.5,
  delta = 0.2
): number {
  const recScore = activity.recommendation_score;

  const travelTime = distances[currentLocation]?.[activity.name] ?? 0;
  const maxTravel = 35;
  const travelPenalty = Math.min(travelTime / maxTravel, 1.0);

  const activityVector = extractInterestVector(activity);
  let similarityPenalty = 0;
  const cumulativeNorm = Math.sqrt(cumulativeVector.reduce((s, v) => s + v * v, 0));
  if (cumulativeNorm > 0) {
    similarityPenalty = Math.max(0, cosineSimilarity(activityVector, cumulativeVector));
  }

  const arrivalTime = currentTime + travelTime;
  const openingTime = activity.openingTime * 60;
  const waitTime = Math.max(0, openingTime - arrivalTime);
  const timingBonus = 1.0 - Math.min(waitTime / 60, 1.0);

  return alpha * recScore - beta * travelPenalty - gamma * similarityPenalty + delta * timingBonus;
}

export function buildItinerary(
  likesDislikes: LikeDislike[],
  activities: Activity[],
  distances: DistanceMatrix,
  startTime: string,
  endTime: string,
  walkSpeed = 50,
  startPoint = "La Statue de Louis XIV",
  maxActivities = 10,
  alpha = 1.0,
  beta = 0.4,
  gamma = 0.5,
  delta = 0.2
): Itinerary {
  const adjustedDistances = applyWalkSpeed(distances, walkSpeed);

  const scoredActivities = recommendActivities(likesDislikes, activities, 1.0, 0.5, true);
  const recScores = new Map(scoredActivities.map(a => [a.activityId, a.recommendation_score]));

  let currentTime = timeToMinutes(startTime);
  const endTimeMin = timeToMinutes(endTime);
  let currentLocation = startPoint;
  const visited = new Set<string>();
  const cumulativeVector = new Array(10).fill(0);
  const itinerary: ItineraryStep[] = [];

  itinerary.push({
    order: 0,
    activity_name: startPoint,
    arrival_time: minutesToTime(currentTime),
    departure_time: minutesToTime(currentTime),
    duration: 0,
    waiting_time: 0,
    travel_time_from_previous: 0,
  });

  while (visited.size < maxActivities) {
    const candidates = scoredActivities.filter(
      act =>
        !visited.has(act.activityId) &&
        act.name !== startPoint &&
        isActivityFeasible(act, currentTime, endTimeMin, currentLocation, adjustedDistances, startPoint)
    );

    if (candidates.length === 0) break;

    const scoredCandidates = candidates.map(candidate => {
      const score = calculateCompositeScore(
        candidate,
        currentTime,
        currentLocation,
        cumulativeVector,
        adjustedDistances,
        alpha,
        beta,
        gamma,
        delta
      );
      return { activity: candidate, score };
    });

    const best = scoredCandidates.reduce((max, curr) => (curr.score > max.score ? curr : max));
    const bestActivity = best.activity;
    const bestScore = best.score;

    const travelTime = adjustedDistances[currentLocation]?.[bestActivity.name] ?? 0;
    const arrivalTime = currentTime + travelTime;
    const openingTime = bestActivity.openingTime * 60;
    const actualStart = Math.max(arrivalTime, openingTime);
    const waitingTime = Math.max(0, openingTime - arrivalTime);
    const duration = bestActivity.duration * 60;
    const departureTime = actualStart + duration;

    itinerary.push({
      order: itinerary.length,
      activity_id: bestActivity.activityId,
      activity_name: bestActivity.name,
      arrival_time: minutesToTime(arrivalTime),
      departure_time: minutesToTime(departureTime),
      duration,
      waiting_time: waitingTime,
      travel_time_from_previous: travelTime,
      composite_score: bestScore,
      recommendation_score: recScores.get(bestActivity.activityId) ?? 0,
    });

    visited.add(bestActivity.activityId);
    const activityVector = extractInterestVector(bestActivity);
    for (let i = 0; i < 10; i++) {
      cumulativeVector[i] += activityVector[i] ?? 0;
    }
    currentLocation = bestActivity.name;
    currentTime = departureTime;
  }

  const returnTravel = adjustedDistances[currentLocation]?.[startPoint] ?? 0;
  const finalArrival = currentTime + returnTravel;

  itinerary.push({
    order: itinerary.length,
    activity_name: startPoint,
    arrival_time: minutesToTime(finalArrival),
    departure_time: minutesToTime(finalArrival),
    duration: 0,
    waiting_time: 0,
    travel_time_from_previous: returnTravel,
  });

  const totalTravel = itinerary.reduce((sum, step) => sum + step.travel_time_from_previous, 0);
  const totalVisit = itinerary.reduce((sum, step) => sum + step.duration, 0);
  const totalWaiting = itinerary.reduce((sum, step) => sum + step.waiting_time, 0);

  return {
    departure_time: startTime,
    arrival_time: minutesToTime(finalArrival),
    total_duration: finalArrival - timeToMinutes(startTime),
    total_activities: visited.size,
    itinerary,
    stats: {
      total_travel_time: totalTravel,
      total_visit_time: totalVisit,
      total_waiting_time: totalWaiting,
    },
  };
}
