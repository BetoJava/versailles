import pandas as pd
import numpy as np
import json
from datetime import timedelta
from itertools import permutations
from utils import *

# Temps disponible pour la visite (en heures)
available_time = 5  # Par exemple, 5 heures
# Définir l'heure de départ (10:00 AM par défaut)
start_time = "10:00"
start_time_seconds = int(start_time.split(":")[0]) * 3600 + int(start_time.split(":")[1]) * 60
wants_to_see_chateau = True

# Charger le fichier CSV des distances entre les activités
dist_df_walk = pd.read_csv(r'activity_distances_temp.csv', index_col=0)

# Charger les données des activités
with open(r'activity_v2.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# Charger les préférences de l'utilisateur (likes/dislikes)
with open(r'user_visit.json', 'r', encoding='utf-8') as file:
    likes_dislikes = json.load(file)

# Créer un DataFrame à partir des données des activités
df = pd.json_normalize(data)

# Convertir la durée des activités en secondes (1 heure = 3600 secondes)
df['duration'] = df['duration'] * 3600  # Conversion en secondes

# Créer un vecteur de préférences utilisateur avec un impact plus modéré
user_preferences = create_user_preferences(likes_dislikes, df, scale_factor=len(likes_dislikes)/20)
# Calculer les scores d'intérêt pour chaque activité
df['interest_score'] = df.apply(lambda row: calculate_interest_score(row, user_preferences), axis=1)

# Exclure les activités dislikées dans 'likes_dislikes'
disliked_activities = [like_data['activityId'] for like_data in likes_dislikes if not like_data['like']]
df = df[~df['activityId'].isin(disliked_activities)]

# Générer le graph des activités
vertex_df, passage_matrix_df = generate_activity_graph(df, dist_df_walk)
# Sélectionner la section à visiter en fonction du temps et des activités les plus intéressantes
selected_section = '2'  # On commence dans la section 3
total_time_in_pole = 0  # Temps total passé dans le pôle 3

# Mettre à jour les arêtes en fonction du temps passé dans le pôle
passage_matrix_df = adjust_edge_weights_for_poles(passage_matrix_df, selected_section, df, total_time_in_pole)
passage_matrix_df.to_csv(r'passage_matrix_after_adjustment.csv', index=False)
# Initialisation de l'itinéraire
route = []
current_time = start_time_seconds  # Temps de départ en secondes
total_time_spent = 0  # Temps total passé dans le pôle en secondes
visited_activities = set()  # Ensemble pour suivre les activités déjà visitées

# Algorithme du voyageur du commerce avec prise en compte du temps de trajet
while total_time_spent < available_time * 3600:
    # Sélectionner les activités triées par intérêt
    top_activities = df[df['sectionId'] == selected_section].sort_values(by='interest_score', ascending=False)

    # Choisir l'activité avec le meilleur score d'intérêt qui n'a pas encore été visitée
    for _, activity in top_activities.iterrows():
        if activity['name'] not in visited_activities:
            current_activity = activity
            activity_duration = int(current_activity['duration'])

            # Ajouter l'activité à l'itinéraire
            route.append(current_activity)

            # Ajouter l'activité à l'ensemble des activités visitées
            visited_activities.add(current_activity['name'])

            # Vérifier l'activité précédente
            if route:
                prev_activity = route[-1]
                prev_name = prev_activity['name']
                # Calculer le temps de trajet entre l'activité précédente et la nouvelle activité
                travel_time = dist_df_walk.loc[prev_name, current_activity['name']] * 60  # En secondes
                total_time_spent += travel_time  # Ajouter le temps de trajet au temps total

            # Ajouter le temps de cette activité à total_time_spent
            total_time_spent += activity_duration

            # Mise à jour de la matrice de passage en fonction du temps passé dans le pôle
            passage_matrix_df = adjust_edge_weights_for_poles(passage_matrix_df, selected_section, df, total_time_spent)

            # Mettre à jour le temps actuel après cette activité
            current_time += activity_duration + travel_time  # Ajouter le temps de trajet au temps actuel

            # Vérifier si nous avons dépassé 90 minutes de visite dans ce pôle
            if total_time_spent >= 90 * 60:
                # Si on est au-delà de 90 minutes, on retire les pénalités de poids externes
                passage_matrix_df = adjust_edge_weights_for_poles(passage_matrix_df, selected_section, df, total_time_spent, apply_penalty=False)

            # Vérifier si nous avons dépassé 3 heures dans ce pôle
            if total_time_spent >= 3 * 3600:
                # Ajouter des pénalités internes après 3 heures dans le pôle
                passage_matrix_df = add_internal_pole_penalties(passage_matrix_df, selected_section, df)
            
            break  # Sortir du loop après avoir sélectionné une activité

    # Si on a dépassé le temps disponible, sortir de la boucle
    if total_time_spent >= available_time * 3600:
        break

import json

# Générer l'itinéraire sous forme de JSON
route_json = {"route": []}
current_time = start_time_seconds  # Temps de départ en secondes

# Ajouter la statue de Louis XIV au début de l'itinéraire
route_json["route"].append({
    "name": "La Statue de Louis XIV",
    "start_time": current_time,
    "end_time": current_time,
    "duration": 0,
    "rating": 0,
    "sectionId": "0"
})

# Ajouter les activités au format JSON
for activity in route:
    activity_duration = int(activity['duration'])  # Durée de l'activité en secondes
    activity_start_time = current_time
    activity_end_time = current_time + activity_duration

    # Calculer une note (rating) basé sur l'intérêt ou un critère spécifique
    activity_rating = activity['interest_score']  # Par exemple, on utilise l'intérêt pour le rating

    route_json["route"].append({
        "name": activity['name'],
        "start_time": activity_start_time,
        "end_time": activity_end_time,
        "duration": activity_duration // 60,  # Durée en minutes
        "rating": activity_rating,
        "sectionId": activity['sectionId']
    })

    # Mettre à jour le temps actuel après l'activité
    current_time = activity_end_time

# Afficher l'itinéraire au format JSON
# print(json.dumps(route_json, indent=4))
