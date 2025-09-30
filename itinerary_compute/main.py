from itinerary_builder import build_itinerary
from typing import Dict, Any


# Input schema
class InputSchema(Dict[str, Any]):
    likes_dislikes: List[Dict[str, Any]]
    start_time: str
    end_time: str
    start_point: str = "La Statue de Louis XIV"
    max_activities: int = 50
    alpha: float = 1.0
    beta: float = 0.4
    gamma: float = 0.5
    delta: float = 0.2

class OutputSchema(Dict[str, Any]):
    itinerary: List[Dict[str, Any]]
    stats: Dict[str, Any]


def main(input: InputSchema) -> OutputSchema:

    



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