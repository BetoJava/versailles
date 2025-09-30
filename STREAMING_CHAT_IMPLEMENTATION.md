# Implémentation du Chat en Streaming

## Vue d'ensemble

Le système de chat utilise maintenant le **streaming** pour afficher les réponses de Mistral AI en temps réel, caractère par caractère, offrant une meilleure expérience utilisateur.

## Architecture

### 1. API Route (`src/app/api/chat/route.ts`)

L'API route gère le streaming côté serveur :

```typescript
POST /api/chat
```

**Fonctionnalités principales :**
- Reçoit le message utilisateur et l'historique de conversation
- Construit un prompt système avec les données des activités et commerces de Versailles
- Utilise l'API Mistral AI en mode streaming (`stream: true`)
- Retourne un `ReadableStream` avec le format Server-Sent Events (SSE)

**Format de streaming :**
```
data: {"content": "Bonjour"}\n\n
data: {"content": " je"}\n\n
data: {"content": " suis"}\n\n
data: [DONE]\n\n
```

### 2. Chat Context (`src/components/chat/chat-context.tsx`)

Le contexte React gère l'état du chat et la consommation du stream :

**Fonctionnalités :**
- `sendMessage()` : Envoie un message et consomme le stream
- Accumule les chunks de texte au fur et à mesure
- Met à jour le message en temps réel avec `updateMessage()`
- Gère les états de streaming (`isStreaming`, `currentStreamingMessageId`)

### 3. Interface Utilisateur

Les composants React affichent les messages en temps réel :
- `ChatContainer` : Conteneur principal
- `MessageList` : Liste des messages avec support du streaming
- `ChatInput` : Input pour envoyer des messages

## Données Contextuelles

Le prompt système inclut automatiquement :

### Activités (activity_v2.json)
- ID, nom, description
- Durée, horaires d'ouverture/fermeture
- URL
- Centres d'intérêt (architecture, histoire, art, etc.)

### Commerces (business_v2.json)
- ID, nom, type
- Horaires, prix
- Téléphone, URL

## Utilisation

### Côté Client

```typescript
import { useChat } from "~/components/chat/chat-context";

function MyComponent() {
  const { sendMessage, state } = useChat();
  
  const handleSend = async () => {
    await sendMessage("Quelles activités recommandes-tu pour un passionné d'histoire ?");
  };
  
  // state.messages contient tous les messages
  // state.isLoading indique si une requête est en cours
}
```

### Côté Serveur

L'API route accepte :
```json
{
  "message": "Question du visiteur",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Message précédent",
      "attachments": []
    },
    {
      "role": "assistant", 
      "content": "Réponse précédente"
    }
  ]
}
```

## Fonctionnalités du Prompt

Le système prompt de Mistral AI :

1. ✅ Expert du Château de Versailles
2. ✅ Recommandations basées sur les données réelles
3. ✅ Informations sur horaires, tarifs, services
4. ✅ Suggestions de visites par journée
5. ✅ Recommandations de boutiques
6. ✅ Réponses en français, conversationnelles et naturelles

## Gestion des Erreurs

- Validation des messages vides
- Vérification de la clé API Mistral (`MISTRAL_API_KEY`)
- Nettoyage des chaînes (caractères de contrôle)
- Gestion des erreurs de streaming
- Messages d'erreur détaillés en développement

## Configuration Requise

### Variables d'environnement
```env
MISTRAL_API_KEY=your_mistral_api_key_here
```

### Dépendances
- `openai` (SDK compatible avec Mistral AI)
- Next.js 14+ (App Router)
- React 18+

## Différences avec l'Ancienne Version

| Aspect | Ancienne Version | Nouvelle Version (Streaming) |
|--------|------------------|------------------------------|
| Affichage | Réponse complète d'un coup | Caractère par caractère |
| UX | Attente de la réponse complète | Feedback immédiat |
| Format API | JSON simple | Server-Sent Events (SSE) |
| Historique | Non supporté | Historique de conversation |
| Messages système | Inclus dans le prompt utilisateur | Message système séparé |

## Tests

Pour tester le système :

1. Démarrez le serveur de développement
```bash
npm run dev
```

2. Naviguez vers `/chat`

3. Posez des questions comme :
   - "Quelles activités recommandes-tu pour un passionné d'architecture ?"
   - "Quels sont les horaires d'ouverture ?"
   - "Où puis-je manger dans le château ?"

## Améliorations Futures

- [ ] Support des images en attachement
- [ ] Sauvegarde de l'historique en base de données
- [ ] Suggestions de questions contextuelles
- [ ] Support multilingue (EN, ES, IT, etc.)
- [ ] Génération d'itinéraires personnalisés
- [ ] Intégration avec le système de recommandation existant
