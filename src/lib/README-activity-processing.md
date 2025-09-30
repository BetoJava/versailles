# Activity Processing Module

Ce module contient les fonctions de traitement des activités pour l'onboarding des visiteurs du Château de Versailles.

## Fichier : `activity-processing.ts`

### Fonctions principales

#### 1. `filterOnConditions(activities, onboardingData)`

Filtre les activités en fonction des conditions définies dans l'onboarding.

**Paramètres :**
- `activities`: Array<Activity> - Liste des activités à filtrer
- `onboardingData`: OnboardingData - Données de l'onboarding du visiteur

**Retour :**
- Array<Activity> - Liste des activités filtrées

**État actuel :** 
Pour l'instant, cette fonction ne filtre rien et retourne toutes les activités. Elle sera implémentée plus tard selon les besoins métier.

---

#### 2. `processByLLM(activities, onboardingData, weather?)`

Traite les activités en parallèle avec l'API Mistral AI pour scorer chaque activité selon les préférences du visiteur.

**Paramètres :**
- `activities`: Activity[] - Liste des activités à scorer
- `onboardingData`: OnboardingData - Données de l'onboarding du visiteur
- `weather`: string (optionnel) - Information météo (par défaut: "Ensoleillé, 20°C")

**Retour :**
- Promise<ScoredActivity[]> - Liste des activités avec leurs scores (les activités avec score = 0 sont filtrées)

**Fonctionnement :**
1. Les activités sont traitées par batch de 5
2. Tous les batches sont traités en parallèle pour optimiser les performances
3. Pour chaque batch, un appel est fait à l'API Mistral AI avec le prompt `processActivityByLLM.md`
4. Le LLM retourne un score de 0 à 5 pour chaque activité
5. Les activités avec un score de 0 sont automatiquement filtrées
6. En cas d'erreur, un score par défaut de 3 est attribué

**Variables d'environnement requises :**
- `MISTRAL_API_KEY` : Clé API Mistral AI

---

## Utilisation dans le router onboarding

```typescript
// 1. Filtrer les activités selon les conditions
const filteredActivities = filterOnConditions(ACTIVITIES_DB, input);

// 2. Traiter les activités avec le LLM pour obtenir les scores
const scoredActivities = await processByLLM(filteredActivities, input);

// 3. Retourner les IDs des activités scorées
return {
  success: true,
  activityIds: scoredActivities.map(activity => activity.id),
  totalActivities: scoredActivities.length,
  // ...
};
```

---

## Types exportés

### `Activity`
Structure complète d'une activité avec tous ses attributs (nom, description, durée, intérêts, etc.)

### `ScoredActivity`
Extension de `Activity` avec un champ `score` optionnel

---

## Configuration requise

1. **Variable d'environnement** : Ajouter `MISTRAL_API_KEY` dans `.env.local`

2. **Package npm** : Le package `openai` doit être installé (compatible avec l'API Mistral AI)

3. **Prompt** : Le fichier `src/assets/prompts/processActivityByLLM.md` doit être présent

---

## Notes techniques

- **Parallélisation** : Les batches d'activités sont traités en parallèle pour réduire le temps de traitement
- **Gestion d'erreurs** : En cas d'échec d'un appel API, un score par défaut est attribué pour éviter de bloquer le processus
- **Format de réponse** : Le LLM retourne un JSON qui est parsé automatiquement
- **Base URL** : L'API Mistral AI est accessible via `https://api.mistral.ai/v1` en utilisant le SDK OpenAI
