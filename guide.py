import pandas as pd
import numpy as np
import json
from datetime import timedelta
from itertools import permutations
from utils import create_user_preferences, calculate_interest_score, select_sections_by_interest, generate_optimized_route_with_travel

# Temps disponible pour la visite (en heures)
available_time = 5  # Par exemple, 5 heures
# Définir l'heure de départ (10:00 AM par défaut)
start_time = "10:00"

# Charger le fichier CSV des distances entre les activités
dist_df_walk = pd.read_csv(r'activity_distances_temp.csv', index_col=0)
print(dist_df_walk)
# Charger les données des activités
with open(r'src\assets\activity.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# Charger les préférences de l'utilisateur (likes/dislikes)
with open(r'jb_visit.json', 'r', encoding='utf-8') as file:
    likes_dislikes = json.load(file)

# Créer un DataFrame à partir des données des activités
df = pd.json_normalize(data)
# Convertir la durée des activités en secondes (1 heure = 3600 secondes)
df['duration'] = df['duration'] * 3600  # Conversion en secondes

# Créer un vecteur de préférences utilisateur avec un impact plus modéré
user_preferences = create_user_preferences(likes_dislikes, df)

# Calculer les scores d'intérêt pour chaque activité
df['interest_score'] = df.apply(lambda row: calculate_interest_score(row, user_preferences), axis=1)

# Exclure les activités dislikées dans 'likes_dislikes'
disliked_activities = [like_data['activityId'] for like_data in likes_dislikes if not like_data['like']]

# Filtrer le DataFrame pour exclure les activités dislikées
df = df[~df['activityId'].isin(disliked_activities)]



# Sélectionner les sections à visiter en fonction du temps et des activités les plus intéressantes
selected_section = select_sections_by_interest(df, available_time, top_n=1)

# Filtrer les activités dans les sections sélectionnées
df_selected = df[df['sectionId']==selected_section[0]]

start_time_seconds = int(start_time.split(":")[0]) * 3600 + int(start_time.split(":")[1]) * 60

# Temps de pause déjeuner (1 heure entre 12h et 14h si nécessaire)
lunch_break_start = 12 * 3600  # 12h00 en secondes
lunch_break_end = 14 * 3600    # 14h00 en secondes

# Filtrer les activités avec un score d'intérêt élevé
top_activities = df_selected.sort_values(by='interest_score', ascending=False).head(5)

# Créer une fonction pour calculer le temps de trajet total pour un parcours
def calculate_travel_time(route, dist_df_walk):
    total_time = 0
    for i in range(1, len(route)):
        prev_activity = route[i-1]
        curr_activity = route[i]

        total_time += dist_df_walk.loc[prev_activity, curr_activity] * 60  # Temps en secondes
    return total_time

# Générer toutes les permutations des activités sélectionnées pour trouver le meilleur itinéraire
activities_names = top_activities['name'].tolist()
best_route = None
best_score = float('-inf')

# Générer toutes les permutations possibles des activités sélectionnées
for route_permutation in permutations(activities_names):
    # Calculer le score total (intérêt + temps de trajet)
    route_score = sum(top_activities[top_activities['name'] == activity]['interest_score'].values[0] for activity in route_permutation)
    travel_time = calculate_travel_time(route_permutation, dist_df_walk)
    
    # Si le temps de trajet est acceptable (moins de 4 heures) et que l'itinéraire est meilleur, choisir cet itinéraire
    if travel_time < 4 * 3600 and route_score > best_score:
        best_score = route_score
        best_route = route_permutation

# Afficher le meilleur itinéraire
print("Meilleur itinéraire optimisé (en tenant compte du plaisir et des déplacements) :")
for activity in best_route:
    print(activity)

# Ajout du retour à la statue de Louis XIV
best_route_with_return = list(best_route) + ['Retour à la Statue de Louis XIV']

print(f"Meilleur itinéraire avec retour : {best_route_with_return}")
generate_optimized_route_with_travel(df, dist_df_walk, best_route, start_time_seconds)
