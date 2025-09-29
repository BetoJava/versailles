"use client"

import { useState } from "react"
import { OnboardingProvider, useOnboarding } from "~/contexts/onboarding-context"
import { ModeToggle } from "~/components/ui/mode-toggle"
import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { api } from "~/trpc/react"
import { HeartIcon, XIcon, MapPinIcon, ClockIcon } from "lucide-react"

function SwipePageContent() {
  const { state } = useOnboarding()
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
  const [likedActivities, setLikedActivities] = useState<string[]>([])
  const [dislikedActivities, setDislikedActivities] = useState<string[]>([])

  // Récupérer les détails de l'activité actuelle
  const { data: currentActivity, isLoading } = api.onboarding.getActivityDetails.useQuery(
    { activityId: state.activityIds[currentActivityIndex] || "" },
    { enabled: !!state.activityIds[currentActivityIndex] }
  )

  const handleLike = () => {
    if (currentActivity) {
      setLikedActivities(prev => [...prev, currentActivity.id])
      setCurrentActivityIndex(prev => prev + 1)
    }
  }

  const handleDislike = () => {
    if (currentActivity) {
      setDislikedActivities(prev => [...prev, currentActivity.id])
      setCurrentActivityIndex(prev => prev + 1)
    }
  }

  const handleSkip = () => {
    setCurrentActivityIndex(prev => prev + 1)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "hard": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "Facile"
      case "medium": return "Modéré"
      case "hard": return "Difficile"
      default: return "Inconnu"
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "architecture": return "Architecture"
      case "nature": return "Nature"
      case "culture": return "Culture"
      case "religion": return "Religion"
      default: return category
    }
  }

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Génération de votre itinéraire personnalisé...</p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur: {state.error}</p>
          <Button onClick={() => window.location.href = "/onboarding"}>
            Retour à l'onboarding
          </Button>
        </div>
      </div>
    )
  }

  if (!currentActivity || currentActivityIndex >= state.activityIds.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <HeartIcon className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Parfait !
          </h1>
          <p className="text-muted-foreground mb-6">
            Vous avez parcouru toutes les activités. Voici votre sélection personnalisée.
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Activités aimées ({likedActivities.length})</h3>
              <p className="text-sm text-muted-foreground">
                Ces activités seront prioritaires dans votre itinéraire.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Activités passées ({dislikedActivities.length})</h3>
              <p className="text-sm text-muted-foreground">
                Ces activités ne seront pas incluses dans votre itinéraire.
              </p>
            </div>
            <Button className="w-full">
              Créer mon itinéraire final
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 relative">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      
      <div className="max-w-md mx-auto pt-16">
        {/* Indicateur de progression */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Activité {currentActivityIndex + 1} sur {state.activityIds.length}</span>
            <span>{Math.round(((currentActivityIndex + 1) / state.activityIds.length) * 100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentActivityIndex + 1) / state.activityIds.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Carte d'activité */}
        <Card className="p-6 mb-6 shadow-lg">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {currentActivity.name}
              </h2>
              <Badge className={getDifficultyColor(currentActivity.difficulty)}>
                {getDifficultyLabel(currentActivity.difficulty)}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPinIcon className="size-4" />
                <span className="text-sm">{getCategoryLabel(currentActivity.category)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <ClockIcon className="size-4" />
                <span className="text-sm">{currentActivity.duration} minutes</span>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-muted-foreground text-sm">
                Cette activité correspond à vos préférences et votre profil de visite.
              </p>
            </div>
          </div>
        </Card>

        {/* Boutons d'action */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleDislike}
            className="flex-1"
          >
            <XIcon className="mr-2 size-4" />
            Passer
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1"
          >
            Plus tard
          </Button>
          
          <Button
            onClick={handleLike}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <HeartIcon className="mr-2 size-4" />
            J'aime
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SwipePage() {
  return (
    <OnboardingProvider>
      <SwipePageContent />
    </OnboardingProvider>
  )
}
