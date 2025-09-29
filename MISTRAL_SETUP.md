# Configuration Mistral AI pour le Chat
## 🎯 Fonctionnalités Implémentées

### ✅ Chat avec Streaming
- Réponses en temps réel via Server-Sent Events
- Utilisation de `mistral-large-latest` par défaut
- Gestion d'erreurs robuste

### ✅ Support des Images
- Upload d'images via l'interface
- Les images sont décrites dans le prompt
- Support de multiples formats d'images

### ✅ Historique des Conversations
- Maintien du contexte entre les messages
- Envoi de l'historique complet à Mistral AI

## 🔧 Structure Technique

### API Routes
- `/api/chat` : Endpoint de streaming avec Mistral AI

### tRPC Procedures
- `chatbot.prepareMessage` : Validation des données
- `chatbot.getResponse` : Réponses simples (pour tests)

### Composants React
- `ChatProvider` : Contexte global avec historique
- `ChatContainer` : Interface principale
- `MessageBubble` : Rendu des messages avec markdown

## 🧪 Test du Système

1. **Démarrer le serveur** :
```bash
pnpm dev
```

2. **Naviguer vers** : `http://localhost:3000/chat`

3. **Tester** :
   - Messages texte simples
   - Upload d'images
   - Streaming en temps réel
   - Suggestions prédéfinies

## ⚙️ Configuration Avancée

### Changer de Modèle
Modifiez dans `src/app/api/chat/route.ts` :
```typescript
const mistralStream = await mistral.chat.stream({
  model: "mistral-medium-latest", // ou "mistral-small-latest"
  // ...
});
```

### Ajuster les Paramètres
```typescript
const mistralStream = await mistral.chat.stream({
  model: "mistral-large-latest",
  maxTokens: 2000,        // Plus de tokens
  temperature: 0.5,       // Moins créatif
  // ...
});
```

## 🔍 Dépannage

### Erreur "MISTRAL_API_KEY n'est pas configurée"
- Vérifiez que `.env.local` existe
- Vérifiez que la variable est bien nommée `MISTRAL_API_KEY`
- Redémarrez le serveur après modification

### Erreur de streaming
- Vérifiez votre clé API sur le dashboard Mistral
- Vérifiez votre quota et limites de taux
- Consultez les logs du serveur pour plus de détails

### Images non analysées
- Mistral AI ne supporte pas encore nativement la vision
- Les images sont actuellement décrites par leur nom de fichier
- Pour une vraie analyse d'images, intégrez un service de vision

## 📝 Notes Importantes

- **Coût** : Chaque message utilise des tokens, surveillez votre usage
- **Limites** : Respectez les limites de taux de Mistral AI
- **Sécurité** : Ne jamais exposer votre clé API côté client
- **Performance** : Le streaming améliore l'expérience utilisateur

## 🔄 Mise à Jour

Pour passer à d'autres LLMs :
1. Remplacez le SDK dans `/api/chat/route.ts`
2. Adaptez le format des messages
3. Modifiez les paramètres selon le modèle
