# Hackathon - Les Clefs de Versailles 
**🏆 1er prix, team "Joueurs de Paume" 🏆**

![pic](readme\pic.webp)
<br></br>

Une application web moderne en Next.js pour créer des itinéraires personnalisés au Château de Versailles, utilisant l'intelligence artificielle pour adapter les recommandations aux préférences des visiteurs.

## Application hébergée sur Vercel à :
https://versailles-three.vercel.app


[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/BetoJava/versailles)



## 🏗️ Architecture et Choix Techniques

### Stack Technologique

- **Frontend** : Next.js avec React, TypeScript
- **Styling** : Tailwind CSS avec composants Radix UI
- **Base de données** : Stockée dans un json
- **IA** : Mistral AI pour le traitement du langage naturel
- **API** : tRPC pour les appels type-safe

### Architecture du Système

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   IA Services   │
│   (Next.js)     │◄──►│   (tRPC API)    │◄──►│   (Mistral AI)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                │
                                ▼
                       ┌─────────────────┐
                       │   File System   │
                       │   (Assets)      │
                       └─────────────────┘
```

### Fonctionnalités Clés

1. **Onboarding Personnalisé** : Collecte des préférences utilisateur (enfants, mobilité, centres d'intérêt)
2. **Système de Recommandation** : Algorithme de scoring basé sur l'IA pour filtrer et classer les activités
3. **Génération d'Itinéraire** : Optimisation des parcours avec calcul des distances et temps de marche
4. **Chat Assistant** : Interface conversationnelle pour obtenir des informations sur Versailles
5. **Visualisation Cartographique** : Affichage interactif des itinéraires sur carte
6. **Export PDF** : Génération d'itinéraires téléchargeables

### Algorithmes de Recommandation

- **Content-Based Filtering** : Analyse des centres d'intérêt des activités
- **Scoring IA** : Utilisation de Mistral AI pour évaluer la pertinence des activités
- **Optimisation de Parcours** : Algorithme de calcul d'itinéraire optimisé avec gestion des contraintes temporelles et spatiales

## 🚀 Installation et Exécution

### Prérequis

- Node.js 18+ 
- pnpm (gestionnaire de paquets)
- Clé API Mistral AI

### Configuration


1. **Installer les dépendances**
```bash
pnpm install
```

2. **Configuration de l'environnement**
```bash
# Copier le fichier d'exemple
cp src/env.example .env

# Éditer .env.local avec vos valeurs
MISTRAL_API_KEY="votre_cle_mistral"
```


### Démarrage de l'application

```bash
pnpm dev
```

L'application sera accessible sur `http://localhost:3000`


## 📁 Structure du Projet

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── api/               # API Routes
│   ├── chat/              # Interface de chat
│   ├── onboarding/        # Processus d'onboarding
│   ├── my-route/          # Affichage de l'itinéraire
│   └── my-maps/           # Visualisation cartographique
├── components/            # Composants réutilisables
│   ├── chat/              # Composants de chat
│   ├── onboarding/        # Composants d'onboarding
│   └── ui/                # Composants UI de base
├── lib/                   # Logique métier
│   ├── itinerary/         # Algorithmes d'itinéraire
│   └── activity-processing.ts
├── server/                # Backend tRPC
│   └── api/               # Routers tRPC
├── assets/                # Données statiques
│   └── data/              # JSON des activités et commerces
└── contexts/              # Contextes React globaux
```
