import googlemaps
import pandas as pd

# Initialiser le client Google Maps avec ta clé API
gmaps = googlemaps.Client(key='AIzaSyCi3V2mwSSTneJpVfZLoOrO-7DiJYTkUrQ')

# Exemple de coordonnées d'un bosquet à Versailles (remplace-les par celles que tu souhaites tester)
bosquet_data = [
    {"name": "Bosquet des Rocailles", "latitude": 48.80507, "longitude": 2.12456},  # Coordonnées fictives
]

# Créer un DataFrame à partir de ces données
df = pd.DataFrame(bosquet_data)

# Fonction pour vérifier l'adresse à partir des coordonnées
def verify_location(row):
    lat, lon = row['latitude'], row['longitude']
    
    # Utiliser l'API pour obtenir des informations sur la localisation
    reverse_geocode_result = gmaps.reverse_geocode((lat, lon))
    
    # Vérifier si l'API renvoie des résultats
    if reverse_geocode_result:
        # Extraire l'adresse du premier résultat
        address = reverse_geocode_result[0]['formatted_address']
        return address
    else:
        return None

# Appliquer la fonction sur chaque ligne du DataFrame
df['verified_address'] = df.apply(verify_location, axis=1)

# Afficher les résultats pour vérifier
print(df[['name', 'latitude', 'longitude', 'verified_address']].head())
