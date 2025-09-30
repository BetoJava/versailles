export interface Activity {
  activityId: string;
  name: string;
  duration: number;
  openingTime: number;
  closingTime: number;
  "interests.architecture": number;
  "interests.landscape": number;
  "interests.politic": number;
  "interests.history": number;
  "interests.courtlife": number;
  "interests.art": number;
  "interests.engineering": number;
  "interests.spirituality": number;
  "interests.nature": number;
  llmScore?: number;
  description?: string;
}

export interface LikeDislike {
  activityId: string;
  like: boolean;
}

interface ActivityWithScore extends Activity {
  recommendation_score: number;
}

export function extractInterestVector(activity: Activity): number[] {
  return [
    activity["interests.architecture"] ?? 0,
    activity["interests.landscape"] ?? 0,
    activity["interests.politic"] ?? 0,
    activity["interests.history"] ?? 0,
    activity["interests.courtlife"] ?? 0,
    activity["interests.art"] ?? 0,
    activity["interests.engineering"] ?? 0,
    activity["interests.spirituality"] ?? 0,
    activity["interests.nature"] ?? 0,
    activity.llmScore ?? 0,
  ];
}

function vectorNorm(vec: number[]): number {
  return Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
}

function normalizeVector(vec: number[]): number[] {
  const norm = vectorNorm(vec);
  return norm > 0 ? vec.map(v => v / norm) : vec;
}

function dotProduct(vec1: number[], vec2: number[]): number {
  return vec1.reduce((sum, val, i) => sum + val * (vec2[i] ?? 0), 0);
}

export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  const norm1 = vectorNorm(vec1);
  const norm2 = vectorNorm(vec2);
  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct(vec1, vec2) / (norm1 * norm2);
}

export function buildUserVector(
  likesDislikes: LikeDislike[],
  activities: Activity[],
  normalize = true
): number[] {
  const activityLookup = new Map(
    activities.map(act => [act.activityId, act])
  );

  const userVector = new Array(10).fill(0);

  for (const swipe of likesDislikes) {
    const activity = activityLookup.get(swipe.activityId);
    if (!activity) continue;

    const activityVector = extractInterestVector(activity);
    for (let i = 0; i < 10; i++) {
      if (swipe.like) {
        userVector[i] += activityVector[i] ?? 0;
      } else {
        userVector[i] -= activityVector[i] ?? 0;
      }
    }
  }

  return normalize ? normalizeVector(userVector) : userVector;
}

function calculateActivityScore(
  activity: Activity,
  userVector: number[],
  negativeActivities: Activity[],
  hasUserPreferences: boolean,
  alpha = 1.0,
  beta = 0.5
): number {
  const activityVector = extractInterestVector(activity);
  
  // Si pas de préférences utilisateur, utiliser uniquement le llmScore
  if (!hasUserPreferences) {
    return activity.llmScore ?? 0;
  }
  
  const baseScore = cosineSimilarity(userVector, activityVector);

  let penalty = 0;
  if (negativeActivities.length > 0) {
    const maxNegativeSimilarity = Math.max(
      ...negativeActivities.map(neg =>
        cosineSimilarity(activityVector, extractInterestVector(neg))
      )
    );
    penalty = beta * maxNegativeSimilarity;
  }

  return alpha * baseScore - penalty;
}

export function recommendActivities(
  likesDislikes: LikeDislike[],
  activities: Activity[],
  alpha = 1.0,
  beta = 0.5,
  excludeSeen = true
): ActivityWithScore[] {
  const hasUserPreferences = likesDislikes.length > 0;
  const userVector = buildUserVector(likesDislikes, activities, true);

  const activityLookup = new Map(
    activities.map(act => [act.activityId, act])
  );

  const negativeActivities = likesDislikes
    .filter(swipe => !swipe.like)
    .map(swipe => activityLookup.get(swipe.activityId))
    .filter((act): act is Activity => act !== undefined);

  const seenIds = excludeSeen
    ? new Set(likesDislikes.map(s => s.activityId))
    : new Set();

  const scoredActivities: ActivityWithScore[] = [];

  for (const activity of activities) {
    if (excludeSeen && seenIds.has(activity.activityId)) continue;

    const score = calculateActivityScore(
      activity,
      userVector,
      negativeActivities,
      hasUserPreferences,
      alpha,
      beta
    );

    scoredActivities.push({
      ...activity,
      recommendation_score: score,
    });
  }

  return scoredActivities.sort((a, b) => b.recommendation_score - a.recommendation_score);
}
