
## KPI
- durée de la visite
- satisfaction

## Regrets
- les visiteurs ne font qu'une infime partie du Chateau de Versailles
- les visiteurs dans cet immensité, ne 

## Importants
- les familles




Données à récupérer :
- age, mobilité, handicap, composition du groupe
- temps de visite prévu, et horaires d'arrivée
- position d'entrée

Données qu'on a :
- météo, affluence (soutenue, moyenne, faible), 


Output
- Lister les choses à visiter
- Créer un itinéraire selon la durée


Features :
- Comment venir ? (dépend de la position d'entrée et départ)


à faire
- [ ] pour chaque activité, passer un LLM pour générer une valeur entre 0 et 1 pour chaque dimension d'embedding

- parcours utilisateur
- 


## y chapeau

- 


- LLM qui demande ce que la personne veut comme visite, il onboard le visiteur, en récupérant toutes les infos + les demandes spécifiques (must great photospot)
- LLM en parallèle qui vont ajouter : un axe supplémentaire (valeur entre 0 et 1 si il devrait faire cette activité), la raison de son score de l'axe supplémentaire (pour explication de l'itinéraire) et un seuil pour shortlist
- swipe 10
- content base ranking -> ranking (dépend de l'axe supplémentaire)
- trouver le meilleur itinéraire avec algo Traveling Salesman Problem (TSP) basé sur ranking, distance, et avec une pénalté sur le choix d'une activité similaire à la précédente

- Description LLM basée sur les raisons de chaque acivité, et la requete principale
- 



---
- récupérer la position pour définir automatiquement l'entrée et sortie


- Ne pas filtrer avant de proposer le swipe
- Ajouter un loader sur fin d'onboarding
 
# Améliorations 
- récupérer les bonnes images pour les bassins et fontaines depuis https://www.chateauversailles.fr/decouvrir/domaine/les-jardins/les-bassins-les-fontaines

- les top activités non sélectionnée seront quand même affichée sur la map à la fin