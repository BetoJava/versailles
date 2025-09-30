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
        like_value = 1 if like_data['like'] else -0.5  
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

def adjust_edge_weights_for_poles(passage_matrix_df, selected_section, df, total_time_in_pole, apply_penalty=True):
    """
    Ajuste les poids des arêtes entre le pôle sélectionné et les autres pôles en ajoutant 10 heures de poids
    au début (avant 90 minutes de visite) et 10 heures de poids après 4 heures de visite dans le pôle.
    
    :param passage_matrix_df: DataFrame de la matrice de passage avec les poids des arêtes
    :param selected_section: Section sélectionnée pour la visite
    :param df: DataFrame des activités avec leurs informations
    :param total_time_in_pole: Temps total passé dans le pôle sélectionné (en secondes)
    :param apply_penalty: Booléen pour appliquer ou non les pénalités
    :return: DataFrame de la matrice de passage ajustée
    """
    adjusted_passage_matrix = passage_matrix_df.copy()

    # Récupérer les activités dans la section sélectionnée
    selected_activities = df[df['sectionId'] == selected_section]

    # Identifier les activités des autres sections, à l'exception de la statue
    other_sections = df[~df['sectionId'].isin([selected_section, '0'])]  # Exclure la section 0 (la statue)
    # Appliquer les pénalités si le paramètre apply_penalty est True
    if apply_penalty:
        # Si le temps passé dans le pôle est inférieur à 90 minutes, ajouter 10 h de poids
        if total_time_in_pole < 90 * 60:
            for _, row_from in selected_activities.iterrows():
                from_name = row_from['name']
                for _, row_to in other_sections.iterrows():
                    to_name = row_to['name']

                    if passage_matrix_df[(passage_matrix_df['from'] == from_name) & (passage_matrix_df['to'] == to_name)].empty:
                        continue

                    # Ajouter 10 h de temps de trajet
                    adjusted_passage_matrix.loc[
                        (adjusted_passage_matrix['from'] == from_name) & 
                        (adjusted_passage_matrix['to'] == to_name), 
                        'travel_time'] += 10 * 3600  # 10 h en secondes

                    
        
        # Si le temps passé dans le pôle dépasse 4 heures, ajouter 10 heures de poids aux arêtes internes du pôle
        elif total_time_in_pole >= 4 * 3600:
            for _, row_from in selected_activities.iterrows():
                from_name = row_from['name']
                for _, row_to in selected_activities.iterrows():
                    to_name = row_to['name']
                    if from_name != to_name:
                        # Ajouter 10 heures de temps de trajet
                        adjusted_passage_matrix.loc[
                            (adjusted_passage_matrix['from'] == from_name) & 
                            (adjusted_passage_matrix['to'] == to_name), 
                            'travel_time'] += 10 * 3600  # 10 heures en secondes

    return adjusted_passage_matrix


def select_activities_in_pole(df, selected_section, available_time, start_time):
    """
    Sélectionner les activités dans le pôle tout en respectant la logique de 90 minutes et 4 heures.
    
    :param df: DataFrame des activités
    :param selected_section: Section sélectionnée pour la visite
    :param available_time: Temps disponible pour la visite (en heures)
    :param start_time: Heure de départ de la visite
    :return: Activités sélectionnées et mise à jour de la matrice de passage
    """
    total_time_spent = 0  # Temps total passé dans le pôle (en secondes)
    total_time_in_pole = 0
    selected_activities = df[df['sectionId'] == selected_section].sort_values(by='interest_score', ascending=False)
    route = []

    for _, activity in selected_activities.iterrows():
        activity_duration = int(activity['duration'])
        # Vérifier si le temps total passé dans le pôle ne dépasse pas 4 heures
        if total_time_spent + activity_duration <= available_time * 3600:
            route.append(activity)
            total_time_spent += activity_duration
            total_time_in_pole += activity_duration
        else:
            break  # Arrêter la sélection si on dépasse le temps disponible

    # Si le temps passé dans le pôle dépasse 90 minutes ou plus, ajuster les arêtes en conséquence
    passage_matrix_df = adjust_edge_weights_for_poles(passage_matrix_df, selected_section, df, total_time_in_pole)

    return route, passage_matrix_df

def add_internal_pole_penalties(passage_matrix_df,selected_section, df):
    """
    Ajoute des pénalités de 10h aux arêtes internes du pôle si le temps passé dans ce pôle dépasse 4 heures.
    """
    adjusted_passage_matrix = passage_matrix_df.copy()
    # Sélectionner les activités dans le pôle sélectionné
    selected_activities = df[df['sectionId'] == selected_section]

    penalty_time = 10 * 60  # Pénalité de 10 heures en secondes
    
    # Ajouter des pénalités aux arêtes internes du pôle
    for _, row_from in selected_activities.iterrows():
        from_name = row_from['name']
        for _, row_to in selected_activities.iterrows():
            to_name = row_to['name']
            
            if from_name != to_name and passage_matrix_df[(passage_matrix_df['from'] == from_name) & (passage_matrix_df['to'] == to_name)].empty:
                continue
            
            # Ajouter 10h (en secondes) de pénalité pour les arêtes internes au pôle
            adjusted_passage_matrix.loc[(adjusted_passage_matrix['from'] == from_name) & (adjusted_passage_matrix['to'] == to_name), 'travel_time'] += penalty_time

    return adjusted_passage_matrix