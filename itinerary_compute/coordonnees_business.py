import json
import pandas as pd
import numpy as np
import googlemaps
import time
from tqdm import tqdm  # Importer tqdm pour la barre de progression

# Initialiser le client Google Maps avec ta clé API
gmaps = googlemaps.Client(key='AIzaSyCi3V2mwSSTneJpVfZLoOrO-7DiJYTkUrQ')

# Charger le fichier JSON
with open(r'business.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# Créer un DataFrame à partir des données
df = pd.json_normalize(data)


# Fonction pour obtenir les coordonnées via le nom de l'activité avec l'API Google Maps Geocoding
def get_coordinates_from_name(activity_name):
    # Utiliser l'API Google Maps Geocoding pour obtenir la latitude et la longitude à partir du nom de l'activité
    geocode_result = gmaps.geocode(activity_name + " Versailles")
    
    # Si un résultat est trouvé, extraire les coordonnées
    if geocode_result:
        lat = geocode_result[0]['geometry']['location']['lat']
        lon = geocode_result[0]['geometry']['location']['lng']
        return lat, lon
    else:
        return None, None

# Ajouter une barre de progression avec tqdm et itérer sur les lignes du DataFrame
for i, row in tqdm(df.iterrows(), total=len(df), desc="Updating Coordinates", ncols=100):
    activity_name = row['name']
    
    # Appeler l'API pour obtenir les coordonnées pour chaque activité
    lat, lon = get_coordinates_from_name(activity_name)
    
    # Mettre à jour les colonnes de latitude et longitude avec les nouvelles valeurs
    df.at[i, 'latitude'] = lat
    df.at[i, 'longitude'] = lon
    
    # Ajouter un délai entre les appels pour éviter de dépasser les quotas
    time.sleep(1)

# Afficher les DataFrame mis à jour avec les nouvelles coordonnées
print(df[['name', 'latitude', 'longitude']].head())

# Sauvegarder le DataFrame mis à jour dans un nouveau fichier JSON (v2)
output_path = r'business_v2.json'
df.to_json(output_path, orient='records', lines=True, force_ascii=False)
print(f"Le fichier mis à jour a été sauvegardé sous {output_path}")
