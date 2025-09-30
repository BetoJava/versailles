import json
import pandas as pd
import numpy as np
from itertools import permutations
import os
from utils import (
    create_user_preferences,
    calculate_interest_score,
    select_sections_by_interest,
    calculate_travel_time,
    generate_activity_graph,
    generate_optimized_route_with_travel
)

def lambda_handler(event, context):
    """
    Handler principal de la fonction Lambda.
    
    Paramètres attendus dans l'événement:
    - available_time: Temps disponible pour la visite (en heures)
    - start_time: Heure de départ (format "HH:MM")
    - likes_dislikes: Liste des likes/dislikes de l'utilisateur
    """
    
    try:
        # Récupérer les paramètres de l'événement
        available_time = event.get('available_time', 5)
        start_time = event.get('start_time', '10:00')
        likes_dislikes = event.get('likes_dislikes', [])
        
        # Convertir l'heure de départ en secondes
        start_time_seconds = int(start_time.split(":")[0]) * 3600 + int(start_time.split(":")[1]) * 60
        
        # Charger les données des activités depuis le fichier local
        activity_file = os.path.join(os.path.dirname(__file__), 'data', 'activity.json')
        with open(activity_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Charger les données de distances depuis le fichier local
        distance_file = os.path.join(os.path.dirname(__file__), 'data', 'activity_distances_temp.csv')
        dist_df_walk = pd.read_csv(distance_file, index_col=0)
        
        # Créer un DataFrame à partir des données des activités
        df = pd.json_normalize(data)
        
        # Convertir la durée des activités en secondes
        df['duration'] = df['duration'] * 3600
        
        # Créer un vecteur de préférences utilisateur
        user_preferences = create_user_preferences(likes_dislikes, df)
        
        # Calculer les scores d'intérêt pour chaque activité
        df['interest_score'] = df.apply(
            lambda row: calculate_interest_score(row, user_preferences), 
            axis=1
        )
        
        # Exclure les activités dislikées
        disliked_activities = [
            like_data['activityId'] 
            for like_data in likes_dislikes 
            if not like_data['like']
        ]
        df = df[~df['activityId'].isin(disliked_activities)]
        
        # Générer le graphe d'activités
        vertex_df, passage_matrix_df = generate_activity_graph(df, dist_df_walk)
        
        # Sélectionner les sections à visiter
        selected_section = select_sections_by_interest(
            vertex_df, 
            passage_matrix_df, 
            available_time, 
            start_time
        )
        
        # Filtrer les activités dans les sections sélectionnées
        df_selected = df[df['sectionId'] == selected_section[0]]
        
        # Filtrer les activités avec un score d'intérêt élevé
        top_activities = df_selected.sort_values(
            by='interest_score', 
            ascending=False
        ).head(5)
        
        # Générer toutes les permutations pour trouver le meilleur itinéraire
        activities_names = top_activities['name'].tolist()
        best_route = None
        best_score = float('-inf')
        
        for route_permutation in permutations(activities_names):
            # Calculer le score total
            route_score = sum(
                top_activities[top_activities['name'] == activity]['interest_score'].values[0] 
                for activity in route_permutation
            )
            travel_time = calculate_travel_time(route_permutation, dist_df_walk)
            
            # Vérifier si l'itinéraire est acceptable
            if travel_time < 4 * 3600 and route_score > best_score:
                best_score = route_score
                best_route = route_permutation
        
        # Générer l'itinéraire détaillé
        route_details = generate_optimized_route_with_travel(
            df, 
            dist_df_walk, 
            best_route, 
            start_time_seconds,
            wants_to_see_chateau=True
        )
        
        # Préparer la réponse
        response = {
            'statusCode': 200,
            'body': json.dumps({
                'best_route': list(best_route),
                'best_score': float(best_score),
                'route_details': route_details,
                'selected_sections': [int(s) for s in selected_section],
                'user_preferences': user_preferences
            }, ensure_ascii=False)
        }
        
        return response
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }