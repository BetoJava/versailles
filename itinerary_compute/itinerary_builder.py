import numpy as np
import csv
from typing import List, Dict, Any, Optional
from content_based_interest import extract_interest_vector, cosine_similarity, recommend_activities


def load_distance_matrix(csv_path: str) -> Dict[str, Dict[str, float]]:
    """Load distance matrix from CSV file."""
    distances = {}
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            activity_name = row['name']
            distances[activity_name] = {k: float(v) for k, v in row.items() if k != 'name'}
    return distances


def time_to_minutes(time_str: str) -> float:
    """Convert HH:MM to minutes since midnight."""
    hours, minutes = map(int, time_str.split(':'))
    return hours * 60 + minutes


def minutes_to_time(minutes: float) -> str:
    """Convert minutes since midnight to HH:MM."""
    hours = int(minutes // 60)
    mins = int(minutes % 60)
    return f"{hours:02d}:{mins:02d}"


def is_activity_feasible(
    activity: Dict[str, Any],
    current_time: float,
    end_time: float,
    current_location: str,
    distances: Dict[str, Dict[str, float]],
    return_point: str = "La Statue de Louis XIV"
) -> bool:
    """Check if activity is feasible given time constraints."""
    travel_time = distances.get(current_location, {}).get(activity['name'], 0)
    arrival_time = current_time + travel_time
    
    opening_time = activity['openingTime'] * 60
    closing_time = activity['closingTime'] * 60
    duration = activity['duration'] * 60
    
    # Check opening hours
    actual_start = max(arrival_time, opening_time)
    if actual_start >= closing_time:
        return False
    
    # Check if we can finish before closing
    finish_time = actual_start + duration
    if finish_time > closing_time:
        return False
    
    # Check if we can return in time
    return_time = distances.get(activity['name'], {}).get(return_point, 0)
    if finish_time + return_time > end_time:
        return False
    
    return True


def calculate_composite_score(
    activity: Dict[str, Any],
    current_time: float,
    current_location: str,
    cumulative_vector: np.ndarray,
    distances: Dict[str, Dict[str, float]],
    rec_scores: Dict[str, float],
    alpha: float = 1.0,
    beta: float = 0.4,
    gamma: float = 0.5,
    delta: float = 0.2
) -> float:
    """Calculate composite score for activity selection."""
    # Base recommendation score
    rec_score = rec_scores.get(str(activity['activityId']), 0)
    
    # Normalize travel time penalty
    travel_time = distances.get(current_location, {}).get(activity['name'], 0)
    max_travel = 35  # max reasonable travel time
    travel_penalty = min(travel_time / max_travel, 1.0)
    
    # Similarity penalty to visited activities
    activity_vector = extract_interest_vector(activity)
    similarity_penalty = 0.0
    if np.linalg.norm(cumulative_vector) > 0:
        similarity_penalty = max(0, cosine_similarity(activity_vector, cumulative_vector))
    
    # Timing bonus
    arrival_time = current_time + travel_time
    opening_time = activity['openingTime'] * 60
    wait_time = max(0, opening_time - arrival_time)
    timing_bonus = 1.0 - min(wait_time / 60, 1.0)  # normalize to 60 min max wait
    
    score = (
        alpha * rec_score
        - beta * travel_penalty
        - gamma * similarity_penalty
        + delta * timing_bonus
    )
    
    return score


def build_itinerary(
    likes_dislikes: List[Dict[str, Any]],
    activities: List[Dict[str, Any]],
    distances: Dict[str, Dict[str, float]],
    start_time: str,
    end_time: str,
    start_point: str = "La Statue de Louis XIV",
    max_activities: int = 10,
    alpha: float = 1.0,
    beta: float = 0.4,
    gamma: float = 0.5,
    delta: float = 0.2
) -> Dict[str, Any]:
    """
    Build optimized itinerary using greedy algorithm with composite scoring.
    
    Args:
        likes_dislikes: User swipe data
        activities: List of all activities
        distances: Distance matrix (minutes)
        start_time: Departure time (HH:MM)
        end_time: Return time (HH:MM)
        start_point: Starting location
        max_activities: Maximum number of activities
        alpha, beta, gamma, delta: Score weights
    
    Returns:
        Complete itinerary with timing and statistics
    """
    # Get recommendation scores
    scored_activities = recommend_activities(likes_dislikes, activities, exclude_seen=True)
    rec_scores = {str(a['activityId']): a['recommendation_score'] for a in scored_activities}
    
    # Initialize state
    current_time = time_to_minutes(start_time)
    end_time_min = time_to_minutes(end_time)
    current_location = start_point
    visited = set()
    cumulative_vector = np.zeros(9)
    itinerary = []
    
    # Add starting point
    itinerary.append({
        "order": 0,
        "activity_name": start_point,
        "arrival_time": minutes_to_time(current_time),
        "departure_time": minutes_to_time(current_time),
        "duration": 0,
        "waiting_time": 0,
        "travel_time_from_previous": 0
    })
    
    # Greedy selection loop
    while len(visited) < max_activities:
        # Filter candidates
        candidates = [
            act for act in scored_activities
            if str(act['activityId']) not in visited
            and act['name'] != start_point
            and is_activity_feasible(act, current_time, end_time_min, current_location, distances, start_point)
        ]
        
        if not candidates:
            break
        
        # Score all candidates
        scored_candidates = []
        for candidate in candidates:
            score = calculate_composite_score(
                candidate, current_time, current_location, cumulative_vector,
                distances, rec_scores, alpha, beta, gamma, delta
            )
            scored_candidates.append((candidate, score))
        
        # Select best
        best_activity, best_score = max(scored_candidates, key=lambda x: x[1])
        
        # Update state
        travel_time = distances.get(current_location, {}).get(best_activity['name'], 0)
        arrival_time = current_time + travel_time
        opening_time = best_activity['openingTime'] * 60
        actual_start = max(arrival_time, opening_time)
        waiting_time = max(0, opening_time - arrival_time)
        duration = best_activity['duration'] * 60
        departure_time = actual_start + duration
        
        # Add to itinerary
        itinerary.append({
            "order": len(itinerary),
            "activity_id": best_activity['activityId'],
            "activity_name": best_activity['name'],
            "arrival_time": minutes_to_time(arrival_time),
            "departure_time": minutes_to_time(departure_time),
            "duration": duration,
            "waiting_time": waiting_time,
            "travel_time_from_previous": travel_time,
            "composite_score": best_score,
            "recommendation_score": rec_scores.get(str(best_activity['activityId']), 0)
        })
        
        # Update state
        visited.add(str(best_activity['activityId']))
        cumulative_vector += extract_interest_vector(best_activity)
        current_location = best_activity['name']
        current_time = departure_time
    
    # Add return
    return_travel = distances.get(current_location, {}).get(start_point, 0)
    final_arrival = current_time + return_travel
    
    itinerary.append({
        "order": len(itinerary),
        "activity_name": start_point,
        "arrival_time": minutes_to_time(final_arrival),
        "departure_time": minutes_to_time(final_arrival),
        "duration": 0,
        "waiting_time": 0,
        "travel_time_from_previous": return_travel
    })
    
    # Calculate stats
    total_travel = sum(step['travel_time_from_previous'] for step in itinerary)
    total_visit = sum(step['duration'] for step in itinerary)
    total_waiting = sum(step['waiting_time'] for step in itinerary)
    
    return {
        "departure_time": start_time,
        "arrival_time": minutes_to_time(final_arrival),
        "total_duration": final_arrival - time_to_minutes(start_time),
        "total_activities": len(visited),
        "itinerary": itinerary,
        "stats": {
            "total_travel_time": total_travel,
            "total_visit_time": total_visit,
            "total_waiting_time": total_waiting
        }
    }


if __name__ == "__main__":
    import json
    
    # Load data
    distances = load_distance_matrix('../activity_distances_temp.csv')
    
    with open('../src/assets/data/activity_v2.json', 'r', encoding='utf-8') as f:
        activities = json.load(f)

    with open('../jb_visit.json', 'r', encoding='utf-8') as f:
        likes_dislikes = json.load(f)
    

    
    # Build itinerary
    result = build_itinerary(
        likes_dislikes=likes_dislikes,
        activities=activities,
        distances=distances,
        max_activities=100,
        start_time="09:00",
        end_time="18:00",
        alpha=1.0,
        beta=0.1,
        gamma=0.5,
        delta=0.2
    )
    
    # Display results
    print(f"=== Itinéraire optimisé ===")
    print(f"Départ: {result['departure_time']}")
    print(f"Retour: {result['arrival_time']}")
    print(f"Durée totale: {result['total_duration']:.0f} min")
    print(f"Activités visitées: {result['total_activities']}\n")
    
    for step in result['itinerary']:
        if step['order'] == 0 or step['order'] == len(result['itinerary']) - 1:
            print(f"{step['order']}. {step['activity_name']} - {step['arrival_time']}")
        else:
            print(f"{step['order']}. {step['activity_name']}")
            print(f"   Arrivée: {step['arrival_time']} | Départ: {step['departure_time']}")
            print(f"   Durée visite: {step['duration']:.0f}min | Trajet: {step['travel_time_from_previous']:.0f}min")
            print(f"   Score: {step['composite_score']:.3f}")
    
    print(f"\n=== Statistiques ===")
    print(f"Temps de visite: {result['stats']['total_visit_time']:.0f} min")
    print(f"Temps de trajet: {result['stats']['total_travel_time']:.0f} min")
    print(f"Temps d'attente: {result['stats']['total_waiting_time']:.0f} min")
