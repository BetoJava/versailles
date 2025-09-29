# Système de Chat LLM avec Streaming et Mistral AI

Ce système de chat modulaire offre une interface utilisateur moderne pour interagir avec Mistral AI avec support du streaming en temps réel et des images.

## Fonctionnalités

### ✅ Messages avec Markdown
- Rendu complet du markdown avec `react-markdown`
- Coloration syntaxique des blocs de code avec `react-syntax-highlighter`
- Support des tableaux, listes, liens, citations
- Bouton de copie pour les blocs de code

### ✅ Streaming en Temps Réel
- Affichage progressif des messages générés
- Indicateurs visuels de streaming
- API route avec Server-Sent Events (SSE)

### ✅ Support des Images
- Upload d'images par glisser-déposer ou sélection
- Aperçu des images avant envoi
- Support de multiples formats d'images

### ✅ Suggestions de Messages
- Suggestions contextuelles pour démarrer la conversation
- Interface intuitive avec icônes et descriptions

### ✅ Interface Modulaire
- Composants réutilisables et configurables
- Thème sombre/clair avec `next-themes`
- Design responsive avec Tailwind CSS

## Architecture

### Composants Principaux

- **`ChatProvider`** : Contexte React pour la gestion d'état global
- **`ChatContainer`** : Conteneur principal du chat
- **`MessageList`** : Liste des messages avec auto-scroll
- **`MessageBubble`** : Bulle de message individuelle
- **`MarkdownRenderer`** : Rendu markdown avec coloration syntaxique
- **`ChatInput`** : Zone de saisie avec support des fichiers
- **`MessageSuggestions`** : Suggestions de messages prédéfinies

### API

- **`/api/chat`** : Endpoint POST pour l'envoi de messages avec streaming SSE

## Utilisation

### Intégration dans une Page

```tsx
import { ChatProvider } from "~/components/chat/chat-context";
import { ChatContainer } from "~/components/chat/chat-container";

export default function ChatPage() {
  return (
    <ChatProvider>
      <div className="flex h-screen flex-col">
        <header className="border-b bg-background/95 backdrop-blur">
          <div className="container flex h-14 items-center">
            <h1 className="text-lg font-semibold">Chat Assistant</h1>
          </div>
        </header>
        <main className="flex-1 overflow-hidden">
          <ChatContainer />
        </main>
      </div>
    </ChatProvider>
  );
}
```

### Personnalisation des Suggestions

Modifiez le tableau `suggestions` dans `MessageSuggestions.tsx` :

```tsx
const suggestions = [
  {
    icon: MessageCircle,
    title: "Votre titre",
    message: "Votre message prédéfini",
    description: "Description de la suggestion",
  },
  // ... autres suggestions
];
```

### Configuration Mistral AI

1. **Obtenir une clé API** : Créez un compte sur [Mistral AI](https://mistral.ai/) et obtenez votre clé API.

2. **Configuration d'environnement** : Ajoutez votre clé API dans `.env.local` :
```bash
MISTRAL_API_KEY=your_mistral_api_key_here
```

3. **Modèles disponibles** :
   - `mistral-large-latest` : Modèle le plus performant (défaut)
   - `mistral-medium-latest` : Bon compromis performance/coût
   - `mistral-small-latest` : Plus rapide et économique

### Support des Images

Le système supporte l'upload d'images qui sont transmises à Mistral AI. Actuellement, les images sont décrites dans le prompt car Mistral AI ne supporte pas encore nativement la vision comme GPT-4V.

Pour une meilleure analyse d'images, vous pouvez :
- Intégrer un service de vision (Google Vision, AWS Rekognition)
- Convertir les images en base64 pour les modèles qui les supportent
- Utiliser des modèles multimodaux alternatifs

## Dépendances

### Principales
- `react-markdown` : Rendu markdown
- `react-syntax-highlighter` : Coloration syntaxique
- `remark-gfm` : Support GitHub Flavored Markdown
- `rehype-highlight` : Coloration syntaxique avancée

### UI
- `@radix-ui/react-*` : Composants UI accessibles
- `lucide-react` : Icônes
- `tailwindcss` : Styles CSS

## Personnalisation

### Thèmes
Le système utilise CSS variables pour les couleurs, facilement personnalisables via Tailwind CSS.

### Composants
Tous les composants sont modulaires et peuvent être étendus ou remplacés individuellement.

### API
L'endpoint `/api/chat` peut être adapté pour n'importe quel fournisseur de LLM.

## Performance

- Streaming optimisé pour une latence minimale
- Images optimisées avec aperçus
- Auto-scroll intelligent
- Gestion mémoire des URLs d'objets
