# Créer un vecteur de préférences pour l'utilisateur basé sur les likes/dislikes
def create_user_preferences(likes_dislikes, df, scale_factor=0.1):
    """
    Crée un vecteur de préférences basé sur les likes et dislikes de l'utilisateur.
    `scale_factor` modère l'impact des avis de l'utilisateur.
    """
    user_preferences = {
        'architecture': 0, 'landscape': 0, 'politic': 0, 'history': 0,
        'courtlife': 0, 'art': 0, 'engineering': 0, 'spirituality': 0, 'nature': 0
    }
    # Mettre à jour les préférences de l'utilisateur en fonction des likes/dislikes
    for like_data in likes_dislikes:
        activity_id = like_data['activityId']
        like_value = 1 if like_data['like'] else -0.5  # +1 pour like, -1 pour dislike
        activity = df[df['activityId'] == str(activity_id)].iloc[0]
        
        # Appliquer les ajustements sur les préférences
        for key in user_preferences.keys():
            user_preferences[key] += activity['interests.' + key] * like_value * scale_factor
    return user_preferences

# Fonction pour formater l'heure en HH:MM
def format_time(seconds):
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    return f"{hours:02}:{minutes:02}"

# Fonction pour ajuster les scores d'intérêt des activités en fonction des préférences utilisateur
def calculate_interest_score(row, user_preferences):
    """
    Calcule le score d'intérêt d'une activité en fonction des préférences utilisateur.
    Utilise uniquement les caractéristiques positives des préférences de l'utilisateur.
    """
    score = 0
    for key, preference in user_preferences.items():
        # Si la préférence est positive, on l'utilise pour augmenter le score
        if preference > 0:
            score += preference * row['interests.' + key]  # Multiplier l'intérêt par la préférence positive
    return score

# Fonction pour sélectionner les meilleures sections en fonction des scores d'intérêt
def select_sections_by_interest(df, available_time, top_n=3):
    """
    Sélectionne les sections à visiter en fonction des scores d'intérêt ajustés
    et du temps disponible.
    """
    # Trier les activités par leur score d'intérêt (du plus élevé au plus bas)
    df_sorted = df.sort_values(by='interest_score', ascending=False)

    # Sélectionner les `top_n` activités les plus intéressantes
    top_activities = df_sorted.head(top_n)

    # Obtenir les sections associées aux `top_n` activités
    selected_sections = top_activities['sectionId'].unique()

    # Limiter le nombre de sections en fonction du temps disponible
    if available_time <= 3:  # Moins de 3 heures
        sections_to_visit = selected_sections[:1]  # Choisir 1 section
    elif available_time <= 5:  # Moins de 5 heures
        sections_to_visit = selected_sections[:2]  # Choisir 2 sections
    elif available_time <= 8:  # Moins de 8 heures
        sections_to_visit = selected_sections[:3]  # Choisir 3 sections
    else:  # Plus de 8 heures (deux jours)
        sections_to_visit = selected_sections[:4]  # Choisir 4 sections

    return sections_to_visit

## Fonction pour convertir les secondes en format HH:MM
def seconds_to_hm(seconds):
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    return f"{hours:02}:{minutes:02}"

import pandas as pd
import numpy as np
import json
from datetime import timedelta

def generate_optimized_route_with_travel(df, dist_df_walk, best_route, start_time_seconds, wants_to_see_chateau
                                         ):
    """
    Génère l'itinéraire optimisé en tenant compte du plaisir, des déplacements et des horaires.
    Affiche les informations de chaque activité avec les temps de trajet et de visite.
    """

    # Initialiser le temps actuel avec l'heure de départ
    current_time = start_time_seconds
    print("Meilleur itinéraire optimisé (en tenant compte du plaisir et des déplacements) :")

    # Ajouter un retour à la statue de Louis XIV
    best_route_with_return = list(best_route) + ['Retour à la Statue de Louis XIV']

    # Boucle à travers les activités du meilleur itinéraire
    for i, activity_name in enumerate(best_route_with_return):
        # Vérifier si c'est le retour à la statue de Louis XIV
        if activity_name == 'Retour à la Statue de Louis XIV':
            prev_activity_name = best_route_with_return[i - 1]
            travel_time = dist_df_walk.loc[prev_activity_name, 'La Statue de Louis XIV'] * 60  # en secondes
            travel_time_h = travel_time // 3600
            travel_time_m = (travel_time % 3600) // 60
            print(f"Temps de trajet entre {prev_activity_name} et La Statue de Louis XIV: {travel_time_h}h {travel_time_m}m")

            # Ajouter le temps de trajet au temps actuel
            current_time += travel_time
            print(f"Retour à la Statue de Louis XIV, Heure d'arrivée: {seconds_to_hm(current_time)}")

        else:
            # Trouver l'activité dans df
            activity = df[df['name'] == activity_name].iloc[0]

            # Si ce n'est pas la première activité, calculer le temps de trajet
            if i > 0:
                prev_activity_name = best_route_with_return[i - 1]
                travel_time = dist_df_walk.loc[prev_activity_name, activity_name] * 60  # en secondes

                # Afficher le temps de trajet
                travel_time_h = travel_time // 3600
                travel_time_m = (travel_time % 3600) // 60
                print(f"Temps de trajet entre {prev_activity_name} et {activity_name}: {travel_time_h}h {travel_time_m}m")

                # Ajouter le temps de trajet au temps actuel
                current_time += travel_time

            # Afficher les informations de l'activité
            activity_start_time = current_time
            activity_duration = int(activity['duration'])  # Durée de l'activité en secondes
            activity_end_time = current_time + activity_duration

            start_time_str = seconds_to_hm(activity_start_time)
            end_time_str = seconds_to_hm(activity_end_time)

            # Afficher les informations de l'activité
            print(f"Activité: {activity['name']}, Début: {start_time_str}, Fin: {end_time_str}, Durée: {seconds_to_hm(activity_duration)}")

            # Mettre à jour le temps actuel après l'activité
            current_time = activity_end_time

# Créer une fonction pour calculer le temps de trajet total pour un parcours
def calculate_travel_time(route, dist_df_walk):
    total_time = 0
    for i in range(1, len(route)):
        prev_activity = route[i-1]
        curr_activity = route[i]

        total_time += dist_df_walk.loc[prev_activity, curr_activity] * 60  # Temps en secondes
    return total_time

def generate_activity_graph(df, dist_df_walk):
    """
    Génère un tableau des sommets avec les informations (name, section, coordonnées)
    et un tableau de la matrice de passage (temps de déplacement entre les activités).
    
    :param df: DataFrame des activités
    :param dist_df_walk: DataFrame des distances entre les activités
    :return: vertex_df (DataFrame des sommets), passage_matrix_df (DataFrame de la matrice de passage)
    """
    print(df.shape)
    
    # Créer une liste pour les sommets et la matrice de passage
    vertex_data = []
    passage_data = []

    # Ajouter les sommets dans le tableau
    for _, row in df.iterrows():
        activity_id = row['activityId']
        name = row['name']
        section = row['sectionId']
        latitude = row['latitude']
        longitude = row['longitude']
        
        # Ajouter l'entrée dans le tableau des sommets
        vertex_data.append({
            'name': name,
            'section': section,
            'coordinates': (latitude, longitude)
        })

    # Créer le DataFrame des sommets
    vertex_df = pd.DataFrame(vertex_data)

    # Calculer la matrice de passage (temps de déplacement entre les activités)
    for _, row_from in df.iterrows():
        from_name = row_from['name']
        for _, row_to in df.iterrows():
            to_name = row_to['name']
            if from_name != to_name:
                # Récupérer le temps de trajet de dist_df_walk
                travel_time = dist_df_walk.loc[from_name, to_name] * 60  # En secondes
                # Ajouter l'information dans la matrice de passage
                passage_data.append({
                    'from': from_name,
                    'to': to_name,
                    'travel_time': travel_time
                })

    # Créer le DataFrame de la matrice de passage
    passage_matrix_df = pd.DataFrame(passage_data)

    # Retourner le DataFrame des sommets et la matrice de passage
    return vertex_df, passage_matrix_df

