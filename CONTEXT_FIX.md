# Correction du problème de persistance du contexte

## Problème identifié

Le contexte `OnboardingProvider` était instancié plusieurs fois :
- Une fois dans `/onboarding/page.tsx`
- Une fois dans `/swipe/page.tsx`

Chaque page créait son propre provider, ce qui signifie que les données stockées dans le contexte lors de l'onboarding étaient **perdues** lors de la navigation vers `/swipe`.

## Symptômes

- Console log dans le router : `16 activités disponibles pour le swipe` ✅
- Console log dans la page swipe : `swipeActivities: []` ❌
- Message affiché : "Aucune activité disponible"

## Solution

### Déplacer le provider au niveau du layout principal

Le `OnboardingProvider` doit être placé **une seule fois** au niveau le plus haut de l'application pour persister entre les navigations.

**Avant** :
```tsx
// src/app/onboarding/page.tsx
export default function OnboardingPage() {
  return (
    <OnboardingProvider>
      <OnboardingPageContent />
    </OnboardingProvider>
  )
}

// src/app/swipe/page.tsx
export default function SwipePage() {
  return (
    <OnboardingProvider>  // ❌ Nouveau contexte, données perdues
      <SwipePageContent />
    </OnboardingProvider>
  )
}
```

**Après** :
```tsx
// src/app/layout.tsx
"use client"

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <TRPCReactProvider>
          <ThemeProvider>
            <OnboardingProvider>  // ✅ Un seul provider pour toute l'app
              {children}
            </OnboardingProvider>
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  )
}

// src/app/onboarding/page.tsx
export default function OnboardingPage() {
  return <OnboardingPageContent />  // ✅ Utilise le provider du layout
}

// src/app/swipe/page.tsx
export default function SwipePage() {
  return <SwipePageContent />  // ✅ Utilise le provider du layout
}
```

## Modifications apportées

### 1. `src/app/layout.tsx`
- ✅ Ajout de `"use client"` en haut du fichier
- ✅ Import de `OnboardingProvider`
- ✅ Suppression de l'export `metadata` (incompatible avec "use client")
- ✅ Encapsulation de `{children}` dans `<OnboardingProvider>`

### 2. `src/app/onboarding/page.tsx`
- ✅ Suppression de l'import `OnboardingProvider`
- ✅ Suppression du wrapping dans `<OnboardingProvider>`
- ✅ Garde uniquement `useOnboarding` pour accéder au contexte

### 3. `src/app/swipe/page.tsx`
- ✅ Suppression de l'import `OnboardingProvider`
- ✅ Suppression du wrapping dans `<OnboardingProvider>`
- ✅ Garde uniquement `useOnboarding` pour accéder au contexte

## Flux de données maintenant

```
1. Utilisateur sur /onboarding
   ↓
2. Remplit le formulaire
   ↓
3. Appelle processOnboarding() → mutation tRPC
   ↓
4. Le router traite les données et retourne :
   - activityIds: ["1", "5", "12", ...]
   - removedActivityIds: ["2", "7", ...]
   - swipeActivities: [{activityId, name, catchy_description, reason}, ...]
   ↓
5. Ces données sont stockées dans le CONTEXTE GLOBAL
   ↓
6. Redirection vers /swipe
   ↓
7. SwipePageContent accède au MÊME contexte
   ↓
8. Les activités sont affichées ✅
```

## Avantages de cette approche

1. **Persistance** : Les données persistent entre les pages
2. **Simplicité** : Un seul provider à gérer
3. **Performance** : Pas de re-création du contexte à chaque navigation
4. **État global** : Toutes les pages peuvent accéder aux données d'onboarding

## Note importante sur "use client"

En marquant `layout.tsx` avec `"use client"`, on perd la possibilité d'exporter `metadata` statique. Si vous avez besoin de métadonnées dynamiques, vous pouvez :

1. Créer un composant client séparé pour le provider
2. Utiliser le composant `<head>` dans chaque page
3. Utiliser `next-seo` pour gérer les métadonnées côté client

Pour l'instant, les métadonnées sont définies dans chaque page individuellement si nécessaire.

## Vérification

Pour vérifier que le contexte persiste correctement :

```tsx
// Dans n'importe quelle page
const { state } = useOnboarding()
console.log("Contexte:", state)
console.log("Activités:", state.swipeActivities)
console.log("Nombre:", state.swipeActivities?.length)
```

Vous devriez voir les données dans toutes les pages après l'onboarding.
