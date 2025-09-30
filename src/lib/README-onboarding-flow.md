# Flux d'onboarding et de swipe

Ce document décrit le flux complet de traitement des activités, depuis l'onboarding jusqu'au swipe.

## Vue d'ensemble

Le processus se déroule en plusieurs étapes :

1. **Onboarding** : Collecte des informations du visiteur
2. **Filtrage conditionnel** : Filtrage des activités selon les conditions
3. **Scoring par LLM** : Attribution d'un score à chaque activité
4. **Préparation pour le swipe** : Sélection des activités à présenter
5. **Swipe** : L'utilisateur choisit ses activités favorites
6. **Génération de l'itinéraire** : Création du parcours optimal

---

## Sources de données

### 1. `activity_v2.json`
Contient **toutes les activités** disponibles à Versailles avec leurs informations complètes :
- Coordonnées géographiques
- Horaires d'ouverture/fermeture
- Durée
- Intérêts (architecture, art, histoire, etc.)
- Type de ticket requis

**Utilisation** : Base de données complète pour le filtrage et le scoring

### 2. `activity_swipe_info_clean.json`
Contient les informations **optimisées pour l'affichage** des cartes de swipe :
- `activityId` : ID de l'activité
- `name` : Nom complet
- `catchy_description` : Description accrocheuse pour la carte
- `reason` : Pourquoi visiter cette activité

**Utilisation** : Affichage des cartes dans l'interface de swipe

---

## Détail du processus

### Étape 1 : Onboarding (`/onboarding`)

L'utilisateur remplit un formulaire en 3 étapes :
- Étape 1 : Présence d'enfants, niveau de marche, handicaps
- Étape 2 : Jours et horaires de visite
- Étape 3 : Préférences textuelles

Ces données sont envoyées à la procédure `processOnboarding`.

### Étape 2 : Filtrage conditionnel

**Fonction** : `filterOnConditions(activities, onboardingData)`

**Fichier** : `src/lib/activity-processing.ts`

**Source** : `activity_v2.json` (toutes les activités)

**Rôle** : Filtrer les activités selon des règles métier (actuellement, aucun filtre appliqué)

**Exemples de filtres possibles** :
- Exclure les activités fermées aux heures de visite
- Exclure les activités non adaptées aux enfants si présence d'enfants
- Exclure les activités non accessibles PMR si besoin

### Étape 3 : Scoring par LLM

**Fonction** : `processByLLM(activities, onboardingData, weather)`

**Fichier** : `src/lib/activity-processing.ts`

**Entrée** : Activités filtrées de l'étape précédente

**Processus** :
1. Les activités sont traitées par batch de 5 en parallèle
2. Pour chaque batch, un appel est fait à l'API Mistral AI
3. Le LLM attribue un score de 0 à 5 à chaque activité selon :
   - Les informations du groupe (enfants, marche, handicaps)
   - Les préférences textuelles
   - La météo
4. Les activités avec un score de 0 sont automatiquement retirées

**Sortie** : Liste des activités avec leurs scores (score > 0)

### Étape 4 : Préparation pour le swipe

**Fichier** : `src/server/api/routers/onboarding.ts`

**Processus** :
1. Calcul des IDs retirés : `removedActivityIds = ALL_IDS - SCORED_IDS`
2. Filtrage de `activity_swipe_info_clean.json` pour exclure les IDs retirés
3. Stockage dans le contexte :
   - `activityIds` : IDs des activités finales
   - `removedActivityIds` : IDs des activités retirées
   - `swipeActivities` : Informations pour l'affichage des cartes

### Étape 5 : Swipe (`/swipe`)

**Fichier** : `src/app/swipe/page.tsx`

**Données affichées** : `state.swipeActivities` (depuis le contexte)

**Processus** :
1. L'utilisateur voit les cartes une par une
2. Pour chaque carte :
   - Swipe à droite (❤️) = J'aime
   - Swipe à gauche (✖️) = Passer
3. Les choix sont stockés localement pendant la session
4. Après au moins 10 swipes, le bouton "Itinéraire" devient actif

**Résultat** :
```json
[
  {
    "activityId": "1",
    "like": true
  },
  {
    "activityId": "5",
    "like": false
  }
]
```

Ce résultat est sauvegardé dans le contexte via `setSwipeResults()`.

### Étape 6 : Génération de l'itinéraire (à implémenter)

**Entrées disponibles dans le contexte** :
- `state.data` : Données d'onboarding
- `state.activityIds` : IDs des activités finales après filtrage
- `state.removedActivityIds` : IDs des activités retirées
- `state.swipedActivities` : IDs des activités aimées (like=true)

---

## Structure du contexte

```typescript
interface OnboardingState {
  data: OnboardingData | null                 // Données d'onboarding
  activityIds: string[]                       // IDs des activités finales
  swipedActivities: string[]                  // IDs des activités aimées
  removedActivityIds: string[]                // IDs des activités retirées
  swipeActivities: SwipeActivity[]            // Infos pour l'affichage
  isLoading: boolean                          // État de chargement
  error: string | null                        // Erreur éventuelle
}
```

---

## Schéma du flux

```
activity_v2.json (98 activités)
         ↓
[filterOnConditions]
         ↓
Activités filtrées (98 activités)
         ↓
[processByLLM] → Attribution de scores
         ↓
Activités scorées (ex: 50 activités, score > 0)
         ↓
removedActivityIds = 98 - 50 = 48 IDs retirés
         ↓
activity_swipe_info_clean.json
         ↓
[Filtre sur IDs retirés]
         ↓
swipeActivities (50 activités pour le swipe)
         ↓
[Page Swipe] → Utilisateur choisit ses favoris
         ↓
swipeResults: [{activityId, like}]
         ↓
[Génération d'itinéraire] (à implémenter)
```

---

## Notes importantes

1. **Activités retirées** : Les activités sont retirées à deux moments :
   - Par `filterOnConditions` (filtre métier)
   - Par `processByLLM` (score = 0)

2. **Données affichées** : La page swipe utilise `activity_swipe_info_clean.json` pour l'affichage, pas `activity_v2.json`, car les descriptions sont optimisées.

3. **Performance** : Le traitement LLM se fait en parallèle (batches de 5) pour optimiser le temps de réponse.

4. **Persistance** : Toutes les données sont stockées dans le contexte React pendant la session. Pour une persistance entre sessions, il faudra implémenter une sauvegarde en base de données.

---

## Prochaines étapes

1. Implémenter les filtres dans `filterOnConditions`
2. Ajouter la génération d'itinéraire optimal
3. Intégrer l'API météo pour le scoring LLM
4. Ajouter la persistance en base de données
5. Optimiser le nombre de swipes requis selon le nombre d'activités
