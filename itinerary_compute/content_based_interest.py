import numpy as np
from typing import List, Dict, Any, Tuple
import json


def extract_interest_vector(activity: Dict[str, Any]) -> np.ndarray:
    """
    Extract the interest vector from an activity.
    
    Args:
        activity: Dictionary containing activity data with interests fields
        
    Returns:
        Numpy array of interest values
    """
    interest_keys = [
        "interests.architecture",
        "interests.landscape",
        "interests.politic",
        "interests.history",
        "interests.courtlife",
        "interests.art",
        "interests.engineering",
        "interests.spirituality",
        "interests.nature"
    ]
    
    vector = np.array([activity.get(key, 0) for key in interest_keys], dtype=float)
    return vector


def build_user_vector(
    likes_dislikes: List[Dict[str, Any]], 
    activities_df: List[Dict[str, Any]],
    normalize: bool = True
) -> np.ndarray:
    """
    Build a user preference vector from their likes and dislikes.
    
    Formula: U = Σ(positive activities) - Σ(negative activities)
    
    Args:
        likes_dislikes: List of {activityId, like} objects
        activities_df: Complete list of activities with interest vectors
        normalize: Whether to L2-normalize the resulting vector
        
    Returns:
        User preference vector
    """
    # Create a lookup dictionary for quick access
    activity_lookup = {str(act["activityId"]): act for act in activities_df}
    
    # Initialize user vector
    user_vector = np.zeros(9)  # 9 interest dimensions
    
    # Process each swipe
    for swipe in likes_dislikes:
        activity_id = str(swipe["activityId"])
        is_like = swipe["like"]
        
        # Get the activity
        if activity_id not in activity_lookup:
            continue
            
        activity = activity_lookup[activity_id]
        activity_vector = extract_interest_vector(activity)
        
        # Add or subtract based on like/dislike
        if is_like:
            user_vector += activity_vector
        else:
            user_vector -= activity_vector
    
    # Normalize if requested
    if normalize:
        norm = np.linalg.norm(user_vector)
        if norm > 0:
            user_vector = user_vector / norm
    
    return user_vector


def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """
    Calculate cosine similarity between two vectors.
    
    Args:
        vec1: First vector
        vec2: Second vector
        
    Returns:
        Cosine similarity score (-1 to 1)
    """
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return np.dot(vec1, vec2) / (norm1 * norm2)


def calculate_activity_score(
    activity: Dict[str, Any],
    user_vector: np.ndarray,
    negative_activities: List[Dict[str, Any]],
    alpha: float = 1.0,
    beta: float = 0.5
) -> float:
    """
    Calculate the recommendation score for a single activity.
    
    Score formula:
    score(c) = α * cos(U, c) - β * max(cos(c, negative_activity))
    
    Args:
        activity: Activity to score
        user_vector: User preference vector
        negative_activities: List of disliked activities
        alpha: Weight for positive similarity (default 1.0)
        beta: Penalty for similarity to rejected activities (default 0.5)
        
    Returns:
        Recommendation score
    """
    activity_vector = extract_interest_vector(activity)
    
    # Base score: similarity to user preferences
    base_score = cosine_similarity(user_vector, activity_vector)
    
    # Penalty: similarity to disliked activities
    penalty = 0.0
    if negative_activities:
        max_negative_similarity = max(
            cosine_similarity(activity_vector, extract_interest_vector(neg_act))
            for neg_act in negative_activities
        )
        penalty = beta * max_negative_similarity
    
    return alpha * base_score - penalty


def recommend_activities(
    likes_dislikes: List[Dict[str, Any]],
    activities_df: List[Dict[str, Any]],
    alpha: float = 1.0,
    beta: float = 0.5,
    exclude_seen: bool = False,
    top_n: int = None
) -> List[Dict[str, Any]]:
    """
    Content-based recommendation engine.
    
    Args:
        likes_dislikes: List of {activityId, like} objects
        activities_df: Complete list of activities
        alpha: Weight for positive similarity (default 1.0)
        beta: Penalty weight for similarity to rejected activities (default 0.5)
        exclude_seen: Whether to exclude already swiped activities
        top_n: Return only top N recommendations (None for all)
        
    Returns:
        Sorted list of activities with recommendation scores
    """
    # Build user preference vector
    user_vector = build_user_vector(likes_dislikes, activities_df, normalize=True)
    
    # Get negative activities for penalty calculation
    activity_lookup = {str(act["activityId"]): act for act in activities_df}
    negative_activities = [
        activity_lookup[str(swipe["activityId"])]
        for swipe in likes_dislikes
        if not swipe["like"] and str(swipe["activityId"]) in activity_lookup
    ]
    
    # Get seen activity IDs
    seen_ids = {str(swipe["activityId"]) for swipe in likes_dislikes} if exclude_seen else set()
    
    # Score all activities
    scored_activities = []
    for activity in activities_df:
        activity_id = str(activity["activityId"])
        
        # Skip if already seen and exclude_seen is True
        if exclude_seen and activity_id in seen_ids:
            continue
        
        # Calculate score
        score = calculate_activity_score(
            activity, 
            user_vector, 
            negative_activities,
            alpha=alpha,
            beta=beta
        )
        
        # Add to results
        scored_activities.append({
            **activity,
            "recommendation_score": score
        })
    
    # Sort by score (highest first)
    scored_activities.sort(key=lambda x: x["recommendation_score"], reverse=True)
    
    # Return top N if specified
    if top_n is not None:
        return scored_activities[:top_n]
    
    return scored_activities


def get_user_interest_profile(
    likes_dislikes: List[Dict[str, Any]],
    activities_df: List[Dict[str, Any]]
) -> Dict[str, float]:
    """
    Get a human-readable interest profile for the user.
    
    Args:
        likes_dislikes: List of {activityId, like} objects
        activities_df: Complete list of activities
        
    Returns:
        Dictionary mapping interest names to preference scores
    """
    user_vector = build_user_vector(likes_dislikes, activities_df, normalize=False)
    
    interest_names = [
        "architecture",
        "landscape",
        "politic",
        "history",
        "courtlife",
        "art",
        "engineering",
        "spirituality",
        "nature"
    ]
    
    return {name: float(score) for name, score in zip(interest_names, user_vector)}


# Example usage
if __name__ == "__main__":
    # Example data
    likes_dislikes_example = [
        {"activityId": "1", "like": True},
        {"activityId": "3", "like": True},
        {"activityId": "5", "like": False}
    ]
    
    activities_example = [
        {
            "activityId": "1",
            "name": "La Galerie des Carrosses",
            "interests.architecture": 4,
            "interests.landscape": 2,
            "interests.politic": 3,
            "interests.history": 5,
            "interests.courtlife": 4,
            "interests.art": 3,
            "interests.engineering": 3,
            "interests.spirituality": 1,
            "interests.nature": 1
        },
        {
            "activityId": "2",
            "name": "Les Jardins",
            "interests.architecture": 2,
            "interests.landscape": 5,
            "interests.politic": 1,
            "interests.history": 3,
            "interests.courtlife": 2,
            "interests.art": 4,
            "interests.engineering": 2,
            "interests.spirituality": 1,
            "interests.nature": 5
        },
        {
            "activityId": "3",
            "name": "La Galerie des Glaces",
            "interests.architecture": 5,
            "interests.landscape": 1,
            "interests.politic": 4,
            "interests.history": 5,
            "interests.courtlife": 5,
            "interests.art": 5,
            "interests.engineering": 3,
            "interests.spirituality": 2,
            "interests.nature": 1
        },
        {
            "activityId": "4",
            "name": "Potager du Roi",
            "interests.architecture": 1,
            "interests.landscape": 4,
            "interests.politic": 1,
            "interests.history": 2,
            "interests.courtlife": 1,
            "interests.art": 1,
            "interests.engineering": 2,
            "interests.spirituality": 1,
            "interests.nature": 5
        },
        {
            "activityId": "5",
            "name": "Chapelle Royale",
            "interests.architecture": 4,
            "interests.landscape": 1,
            "interests.politic": 2,
            "interests.history": 4,
            "interests.courtlife": 3,
            "interests.art": 4,
            "interests.engineering": 2,
            "interests.spirituality": 5,
            "interests.nature": 1
        }
    ]
    
    # Get recommendations
    recommendations = recommend_activities(
        likes_dislikes_example,
        activities_example,
        alpha=1.0,
        beta=0.5,
        exclude_seen=True,
        top_n=3
    )
    print(recommendations)
    
    print("Top 3 Recommendations:")
    for i, activity in enumerate(recommendations, 1):
        print(f"{i}. {activity['name']} (score: {activity['recommendation_score']:.3f})")
    
    # Get user profile
    print("\nUser Interest Profile:")
    profile = get_user_interest_profile(likes_dislikes_example, activities_example)
    for interest, score in sorted(profile.items(), key=lambda x: x[1], reverse=True):
        print(f"  {interest}: {score:.2f}")
