# Initialiser le client Google Maps avec ta clé API
gmaps = googlemaps.Client(key='AIzaSyCi3V2mwSSTneJpVfZLoOrO-7DiJYTkUrQ')
import json
import pandas as pd
import numpy as np
import googlemaps
import time
from tqdm import tqdm

# Charger le fichier JSON
with open(r'versailles\src\assets\activity.json', 'r', encoding='utf-8') as file:  # Utilise le fichier v2 créé précédemment
    data = json.load(file)

# Créer un DataFrame à partir des données
df = pd.json_normalize(data)

# Fonction pour obtenir la distance à pied entre deux coordonnées via l'API Google Maps Directions
def get_walk_distance(lat1, lon1, lat2, lon2):
    # Utiliser l'API Google Maps Directions pour obtenir la distance à pied entre deux points
    origin = (lat1, lon1)
    destination = (lat2, lon2)
    
    # Essayer de récupérer la distance avec un mécanisme de réessai en cas d'échec
    retries = 3  # Nombre de tentatives en cas d'erreur
    for attempt in range(retries):
        try:
            # Appel API pour obtenir la distance à pied (mode walking)
            directions_result = gmaps.directions(origin, destination, mode="walking")
            
            # Si un itinéraire est trouvé, extraire la durée
            if directions_result:
                duration = directions_result[0]['legs'][0]['duration']['value']  # Durée en secondes
                return duration / 60  # Convertir en minutes
            else:
                return None
        except Exception as e:
            print(f"Erreur lors de l'appel API pour {origin} -> {destination}: {e}")
            if attempt < retries - 1:
                print(f"Tentative {attempt + 1}/{retries}, réessayer après 5 secondes...")
                time.sleep(5)  # Attendre 5 secondes avant de réessayer
            else:
                return None
    return None

# Créer une matrice de distances (en minutes à pied)
dist_matrix_walk = np.zeros((len(df), len(df)))  # Matrice de distances en minutes à pied

# Sauvegarder les distances au fur et à mesure dans un fichier JSON
output_path = r'versailles\activity_distances.json'

# Initialiser un dictionnaire pour stocker les distances par paire
distance_data = {}

# Ajouter une barre de progression avec tqdm et itérer sur les lignes du DataFrame
for i, row_i in tqdm(df.iterrows(), total=len(df), desc="Calculating Distances", ncols=100):
    for j, row_j in df.iterrows():
        if i != j:
            # Récupérer les coordonnées de chaque activité
            lat1, lon1 = row_i['latitude'], row_i['longitude']
            lat2, lon2 = row_j['latitude'], row_j['longitude']
            
            # Récupérer la distance à pied via l'API
            dist = get_walk_distance(lat1, lon1, lat2, lon2)
            
            # Si la distance a été récupérée avec succès, l'ajouter à la matrice
            if dist is not None:
                dist_matrix_walk[i, j] = dist
                # Enregistrer la distance dans le dictionnaire pour la sauvegarde immédiate
                distance_data[f"{row_i['name']} -> {row_j['name']}"] = dist
                
                # Sauvegarder l'état actuel du fichier JSON avec les distances calculées jusqu'à présent
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(distance_data, f, ensure_ascii=False, indent=4)
            
            # Ajouter un délai entre les appels pour éviter de dépasser les quotas de l'API

# Créer un DataFrame pour afficher les distances à pied entre toutes les activités
dist_df_walk = pd.DataFrame(dist_matrix_walk, columns=df['name'], index=df['name'])

# Afficher la matrice de distances en minutes à pied
print(dist_df_walk)

# Finalement, sauvegarder la matrice de distances complète dans un fichier CSV
dist_df_walk.to_csv(r'versailles\activity_distances.csv', encoding='utf-8')
print("Matrice de distances sauvegardée sous versailles/activity_distances.csv")
