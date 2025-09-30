"""
Fonctions utilitaires pour le calcul d'itinéraires optimisés
"""
import pandas as pd
import numpy as np
import json


def create_user_preferences(likes_dislikes, df, scale_factor=0.1):
    """
    Crée un vecteur de préférences basé sur les likes et dislikes de l'utilisateur.
    `scale_factor` modère l'impact des avis de l'utilisateur.
    """
    user_preferences = {
        'architecture': 0, 'landscape': 0, 'politic': 0, 'history': 0,
        'courtlife': 0, 'art': 0, 'engineering': 0, 'spirituality': 0, 'nature': 0
    }
    
    for like_data in likes_dislikes:
        activity_id = like_data['activityId']
        like_value = 1 if like_data['like'] else -0.5
        
        # Chercher l'activité correspondante
        activity_matches = df[df['activityId'] == str(activity_id)]
        if len(activity_matches) == 0:
            continue
            
        activity = activity_matches.iloc[0]
        
        # Appliquer les ajustements sur les préférences
        for key in user_preferences.keys():
            user_preferences[key] += activity['interests.' + key] * like_value * scale_factor
    
    return user_preferences


def format_time(seconds):
    """Formate l'heure en HH:MM"""
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    return f"{hours:02}:{minutes:02}"


def calculate_interest_score(row, user_preferences):
    """
    Calcule le score d'intérêt d'une activité en fonction des préférences utilisateur.
    Utilise uniquement les caractéristiques positives des préférences de l'utilisateur.
    """
    score = 0
    for key, preference in user_preferences.items():
        if preference > 0:
            score += preference * row['interests.' + key]
    return score


def select_sections_by_interest(vertex_df, passage_matrix_df, available_time, start_time):
    """
    Sélectionne les sections à visiter en fonction du temps disponible.
    
    Note: Cette fonction a été simplifiée car vertex_df ne contient pas 'interest_score'.
    Dans la Lambda, le calcul des scores se fait avant dans le handler.
    """
    # Obtenir les sections uniques
    sections = vertex_df['section'].unique()
    
    # Limiter le nombre de sections en fonction du temps disponible
    if available_time <= 3:
        sections_to_visit = sections[:1]
    elif available_time <= 5:
        sections_to_visit = sections[:2]
    elif available_time <= 8:
        sections_to_visit = sections[:3]
    else:
        sections_to_visit = sections[:4]
    
    return sections_to_visit


def seconds_to_hm(seconds):
    """Convertit les secondes en format HH:MM"""
    hours = int(seconds) // 3600
    minutes = (int(seconds) % 3600) // 60
    return f"{hours:02}:{minutes:02}"


def generate_optimized_route_with_travel(df, dist_df_walk, best_route, start_time_seconds, wants_to_see_chateau=True):
    """
    Génère l'itinéraire optimisé en tenant compte du plaisir, des déplacements et des horaires.
    Retourne les informations de chaque activité avec les temps de trajet et de visite.
    """
    current_time = start_time_seconds
    route_details = []
    
    # Ajouter un retour à la statue de Louis XIV
    best_route_with_return = list(best_route) + ['Retour à la Statue de Louis XIV']
    
    for i, activity_name in enumerate(best_route_with_return):
        if activity_name == 'Retour à la Statue de Louis XIV':
            prev_activity_name = best_route_with_return[i - 1]
            
            # Vérifier si les indices existent dans la matrice de distances
            if prev_activity_name in dist_df_walk.index and 'La Statue de Louis XIV' in dist_df_walk.columns:
                travel_time = dist_df_walk.loc[prev_activity_name, 'La Statue de Louis XIV'] * 60
            else:
                travel_time = 0
            
            travel_time_h = travel_time // 3600
            travel_time_m = (travel_time % 3600) // 60
            
            current_time += travel_time
            
            route_details.append({
                'type': 'return',
                'name': 'La Statue de Louis XIV',
                'arrival_time': seconds_to_hm(current_time),
                'travel_time': f"{int(travel_time_h)}h {int(travel_time_m)}m",
                'from': prev_activity_name
            })
        else:
            # Trouver l'activité dans df
            activity_matches = df[df['name'] == activity_name]
            if len(activity_matches) == 0:
                continue
            
            activity = activity_matches.iloc[0]
            
            travel_time = 0
            if i > 0:
                prev_activity_name = best_route_with_return[i - 1]
                
                # Vérifier si les indices existent dans la matrice de distances
                if prev_activity_name in dist_df_walk.index and activity_name in dist_df_walk.columns:
                    travel_time = dist_df_walk.loc[prev_activity_name, activity_name] * 60
                
                current_time += travel_time
            
            activity_start_time = current_time
            activity_duration = int(activity['duration'])
            activity_end_time = current_time + activity_duration
            
            travel_time_h = travel_time // 3600
            travel_time_m = (travel_time % 3600) // 60
            
            route_details.append({
                'type': 'activity',
                'name': activity['name'],
                'activity_id': activity['activityId'],
                'start_time': seconds_to_hm(activity_start_time),
                'end_time': seconds_to_hm(activity_end_time),
                'duration': seconds_to_hm(activity_duration),
                'travel_time': f"{int(travel_time_h)}h {int(travel_time_m)}m" if i > 0 else None,
                'from': best_route_with_return[i - 1] if i > 0 else None,
                'interest_score': float(activity.get('interest_score', 0))
            })
            
            current_time = activity_end_time
    
    return route_details


def calculate_travel_time(route, dist_df_walk):
    """Calcule le temps de trajet total pour un parcours"""
    total_time = 0
    for i in range(1, len(route)):
        prev_activity = route[i-1]
        curr_activity = route[i]
        
        # Vérifier si les indices existent dans la matrice
        if prev_activity in dist_df_walk.index and curr_activity in dist_df_walk.columns:
            total_time += dist_df_walk.loc[prev_activity, curr_activity] * 60
    
    return total_time


def generate_activity_graph(df, dist_df_walk):
    """
    Génère un tableau des sommets avec les informations (name, section, coordonnées)
    et un tableau de la matrice de passage (temps de déplacement entre les activités).
    """
    vertex_data = []
    passage_data = []
    
    # Ajouter les sommets dans le tableau
    for _, row in df.iterrows():
        name = row['name']
        section = row['sectionId']
        latitude = row.get('latitude', 0)
        longitude = row.get('longitude', 0)
        
        vertex_data.append({
            'name': name,
            'section': section,
            'coordinates': (latitude, longitude)
        })
    
    # Créer le DataFrame des sommets
    vertex_df = pd.DataFrame(vertex_data)
    
    # Calculer la matrice de passage
    for _, row_from in df.iterrows():
        from_name = row_from['name']
        for _, row_to in df.iterrows():
            to_name = row_to['name']
            if from_name != to_name:
                # Vérifier si les indices existent
                if from_name in dist_df_walk.index and to_name in dist_df_walk.columns:
                    travel_time = dist_df_walk.loc[from_name, to_name] * 60
                    
                    passage_data.append({
                        'from': from_name,
                        'to': to_name,
                        'travel_time': travel_time
                    })
    
    # Créer le DataFrame de la matrice de passage
    passage_matrix_df = pd.DataFrame(passage_data)
    
    return vertex_df, passage_matrix_df
