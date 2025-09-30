import pandas as pd
import numpy as np
import json
import math

# Charger les données des activités (assurez-vous que vous avez le bon format)
with open(r'src\assets\activity.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# Créer un DataFrame à partir des données des activités
df = pd.json_normalize(data)

# Fonction pour calculer la distance entre deux coordonnées via la formule de Haversine
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Rayon de la Terre en kilomètres
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    delta_phi = np.radians(lat2 - lat1)
    delta_lambda = np.radians(lon2 - lon1)

    a = np.sin(delta_phi / 2)**2 + np.cos(phi1) * np.cos(phi2) * np.sin(delta_lambda / 2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    distance = R * c  # distance en kilomètres
    return distance

# Calculer la matrice de distances (en kilomètres) entre toutes les paires d'activités
dist_matrix = np.zeros((len(df), len(df)))  # Matrice de distances en kilomètres

for i, row_i in df.iterrows():
    for j, row_j in df.iterrows():
        if i != j:
            lat1, lon1 = row_i['latitude'], row_i['longitude']
            lat2, lon2 = row_j['latitude'], row_j['longitude']
            
            # Calculer la distance entre les deux points
            dist_matrix[i, j] = haversine(lat1, lon1, lat2, lon2)

# Convertir la matrice de distances en minutes à pied (en supposant 5 km/h comme vitesse de marche)
# 5 km/h => 1 km en 12 minutes
dist_matrix_walk = dist_matrix * 12  # Conversion en minutes à pied

# Créer un DataFrame pour afficher les distances à pied entre toutes les activités
dist_df_walk = pd.DataFrame(dist_matrix_walk, columns=df['name'], index=df['name'])

# Sauvegarder la matrice de distances dans un fichier CSV
dist_df_walk.to_csv(r'activity_distances_temp.csv', encoding='utf-8')

print("Matrice de distances enregistrée sous versailles/activity_distances_temp.csv")
