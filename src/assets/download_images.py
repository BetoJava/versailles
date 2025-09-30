import json
import os
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# --- Configuration ---
JSON_FILE_PATH = 'activity.json'
OUTPUT_DIR = 'activity_images_2'
# Se faire passer pour un navigateur pour éviter d'être bloqué
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def find_background_image_url(tag):
    """
    Fonction de filtre pour BeautifulSoup.
    Retourne True si la balise a un attribut 'style' contenant 'background-image'.
    """
    return tag.has_attr('style') and 'background-image' in tag['style']

def scrape_versailles_images(json_path, output_dir):
    """
    Lit le fichier JSON, visite chaque URL, et télécharge la première image de fond trouvée.
    """
    # Créer le dossier de sortie s'il n'existe pas
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Dossier créé : {output_dir}")

    # Charger les données du JSON
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            activities = json.load(f)
    except FileNotFoundError:
        print(f"Erreur : Le fichier '{json_path}' est introuvable.")
        return
    
    print(f"{len(activities)} activités à traiter.")

    # Traiter chaque activité
    for activity in activities:
        display_name = activity.get('name')
        activity_id = activity.get('activityId')
        page_url = activity.get('url')

        if not all([display_name, activity_id, page_url]):
            print("Entrée ignorée car 'display_name', 'activityId', ou 'url' est manquant.")
            continue

        print(f"\nTraitement de l'ID {activity_id}: {display_name}")

        try:
            # 1. Obtenir le contenu de la page web
            response = requests.get(page_url, headers=HEADERS, timeout=15)
            response.raise_for_status()  # Lève une exception si la requête échoue (ex: 404)

            # 2. Analyser le HTML avec BeautifulSoup
            soup = BeautifulSoup(response.text, 'html.parser')

            # 3. Trouver la première balise avec le style 'background-image'
            image_tag = soup.find(find_background_image_url)

            if not image_tag:
                print(f"  -> AVERTISSEMENT : Aucune balise avec 'background-image' trouvée pour {display_name}")
                continue

            # 4. Extraire l'URL de l'image depuis l'attribut style
            style_content = image_tag['style']
            # Utiliser une expression régulière pour extraire ce qui se trouve dans url(...)
            match = re.search(r"url\(['\"]?(.*?)['\"]?\)", style_content)
            
            if not match:
                print(f"  -> AVERTISSEMENT : Impossible d'extraire l'URL de l'image du style pour {display_name}")
                continue
            
            image_url_relative = match.group(1)
            
            # 5. Rendre l'URL de l'image absolue
            absolute_image_url = urljoin(page_url, image_url_relative)
            print(f"  -> URL de l'image trouvée : {absolute_image_url}")

            # 6. Télécharger l'image
            img_response = requests.get(absolute_image_url, headers=HEADERS, stream=True, timeout=15)
            img_response.raise_for_status()

            # Déterminer l'extension du fichier
            content_type = img_response.headers.get('content-type')
            extension = '.jpg' # Par défaut
            if content_type:
                if 'jpeg' in content_type:
                    extension = '.jpg'
                elif 'png' in content_type:
                    extension = '.png'
                elif 'gif' in content_type:
                    extension = '.gif'
            
            # 7. Sauvegarder l'image
            output_filename = f"{activity_id}{extension}"
            output_path = os.path.join(output_dir, output_filename)
            
            with open(output_path, 'wb') as f:
                for chunk in img_response.iter_content(1024):
                    f.write(chunk)
            
            print(f"  -> Succès ! Image sauvegardée sous : {output_filename}")

        except requests.exceptions.RequestException as e:
            print(f"  -> ERREUR : Problème de réseau pour {display_name}: {e}")
        except Exception as e:
            print(f"  -> ERREUR : Une erreur inattendue est survenue pour {display_name}: {e}")


if __name__ == '__main__':
    scrape_versailles_images(JSON_FILE_PATH, OUTPUT_DIR)
    print("\nScript terminé.")