"use client"

import { useState, useRef, useEffect } from "react"
import { useOnboarding } from "~/contexts/onboarding-context"
import { ModeToggle } from "~/components/ui/mode-toggle"
import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { api } from "~/trpc/react"
import { CircleQuestionMarkIcon, HeartIcon, Image, LoaderIcon, XIcon } from "lucide-react"
import { useRouter } from "next/navigation"

interface ActivityImageProps {
  activityId: string
  alt: string
  activityName: string
}

function ActivityImage({ activityId, alt, activityName }: ActivityImageProps) {
  const [hasError, setHasError] = useState(false)

  const handleImageError = () => {
    console.log(`Local image failed to load: /activity_images/${activityId}.jpg`)
    setHasError(true)
  }

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-primary/10">
        <div className="text-center">
          <Image className="text-muted-foreground mx-auto mb-2" size={48} />
          <p className="text-sm text-muted-foreground">Image non disponible</p>
        </div>
      </div>
    )
  }

  return (
    <img
      src={`/activity_images/${activityId}.jpg`}
      alt={alt}
      className="w-full h-full object-cover"
      onError={handleImageError}
    />
  )
}

interface SwipeableCardProps {
  activity: {
    activityId: string
    name: string
    catchy_description: string
    reason: string
  }
  onSwipe: (direction: 'left' | 'right') => void
  isTop: boolean
}

function SwipeableCard({ activity, onSwipe, isTop }: SwipeableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [opacity, setOpacity] = useState(1)
  const [isSwiped, setIsSwiped] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  // Réinitialiser les états quand l'activité change
  useEffect(() => {
    setPosition({ x: 0, y: 0 })
    setRotation(0)
    setOpacity(1)
    setIsDragging(false)
    setIsSwiped(false)
  }, [activity.activityId])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isTop) return
    setIsDragging(true)
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isTop) return
    setIsDragging(true)
    const touch = e.touches[0]!
    dragStart.current = { x: touch.clientX - position.x, y: touch.clientY - position.y }
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !isTop) return

    const newX = clientX - dragStart.current.x
    const newY = clientY - dragStart.current.y

    setPosition({ x: newX, y: newY })
    setRotation(newX * 0.1)
    setOpacity(1 - Math.abs(newX) / 300)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]!
    handleMove(touch.clientX, touch.clientY)
  }

  const handleEnd = () => {
    if (!isDragging || !isTop) return
    setIsDragging(false)

    const threshold = 100
    if (Math.abs(position.x) > threshold) {
      const direction = position.x > 0 ? 'right' : 'left'
      // Masquer la carte immédiatement et appeler onSwipe
      setIsSwiped(true)
      setOpacity(0)
      onSwipe(direction)
    } else {
      // Retour à la position initiale
      setPosition({ x: 0, y: 0 })
      setRotation(0)
      setOpacity(1)
    }
  }

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0]!
        handleMove(touch.clientX, touch.clientY)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('mouseup', handleEnd)
      document.addEventListener('touchend', handleEnd)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('mouseup', handleEnd)
        document.removeEventListener('touchend', handleEnd)
      }
    }
  }, [isDragging, position])

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "architecture": return "Architecture"
      case "nature": return "Nature"
      case "culture": return "Culture"
      case "religion": return "Religion"
      default: return category
    }
  }

  // Ne pas rendre la carte si elle a été swipée
  if (isSwiped) {
    return null
  }

  return (
    <div
      ref={cardRef}
      className={`absolute w-full max-w-sm mx-auto cursor-grab active:cursor-grabbing select-none ${isTop ? 'z-20' : 'z-10'
        }`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
        opacity: isTop ? opacity : 1,
        transition: isDragging ? 'none' : 'all 0.3s ease-out',
        scale: 1, // Toutes les cartes ont la même taille
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <Card className="h-[calc(100vh-8rem)] overflow-hidden shadow-2xl border-0 flex flex-col">
        {/* Image */}
        <div className="h-80 relative overflow-hidden">
          <ActivityImage
            activityId={activity.activityId}
            alt={activity.name}
            activityName={activity.name}
          />
        </div>

        {/* Contenu */}
        <div className="flex-1 p-4 sm:p-6 flex flex-col gap-6">
          <div className="space-y-2">
            <div>
              <h2 className="text-2xl font-bold text-foreground leading-tight tracking-tight mb-2">
                {activity.name}
              </h2>
            </div>

            <p className="text-muted-foreground text-sm sm:text-base">
              {activity.catchy_description}
            </p>
          </div>

          <div className="">
            <div className="flex items-center gap-2 mb-2">

              <CircleQuestionMarkIcon className="size-4 text-muted-foreground" />
              <h3 className="text-xs">Pourquoi y aller ?</h3>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {activity.reason}
            </p>
          </div>
        </div>
      </Card>

      {/* Indicateurs de swipe */}
      {isTop && (
        <>
          <div
            className={`absolute top-20 left-8 px-4 py-2 bg-red-500 text-white font-bold rounded-lg transform rotate-12 transition-opacity ${position.x < -50 ? 'opacity-100' : 'opacity-0'
              }`}
          >
            PASSER
          </div>
          <div
            className={`absolute top-20 right-8 px-4 py-2 bg-green-500 text-white font-bold rounded-lg transform -rotate-12 transition-opacity ${position.x > 50 ? 'opacity-100' : 'opacity-0'
              }`}
          >
            J'AIME
          </div>
        </>
      )}
    </div>
  )
}

function SwipePageContent() {
  const router = useRouter()
  const { state, setSwipeResults, setItinerary } = useOnboarding()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [likedActivities, setLikedActivities] = useState<string[]>([])
  const [dislikedActivities, setDislikedActivities] = useState<string[]>([])
  const [swipeCount, setSwipeCount] = useState(0)
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(true)
  
  const buildItineraryMutation = api.itinerary.buildItinerary.useMutation({
    onSuccess: (result) => {
      console.log("Itinéraire généré:", result)
      setItinerary(result.itinerary)
      router.push("/my-route")
    },
    onError: (error) => {
      console.error("Erreur lors de la génération de l'itinéraire:", error)
    }
  })

  // Utiliser les activités du contexte (celles qui ont passé le filtrage)
  const activities = state.swipeActivities
  const isLoading = state.isLoading

  // Debug logs
  console.log("État du contexte dans SwipePageContent:", state)
  console.log("swipeActivities:", state.swipeActivities)
  console.log("Nombre d'activités:", state.swipeActivities?.length)
  console.log("isLoading:", state.isLoading)
  console.log("error:", state.error)

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!activities) return

    const currentActivity = activities[currentIndex]
    if (!currentActivity) return

    if (direction === 'right') {
      setLikedActivities(prev => [...prev, currentActivity.activityId])
    } else {
      setDislikedActivities(prev => [...prev, currentActivity.activityId])
    }

    setSwipeCount(prev => prev + 1)
    setCurrentIndex(prev => prev + 1)
  }

  const handleButtonAction = (action: 'like' | 'dislike') => {
    handleSwipe(action === 'like' ? 'right' : 'left')
  }

  const handleItineraryClick = () => {
    if (!state.data?.visitDays || state.data.visitDays.length === 0) {
      console.error("Pas de jour de visite défini")
      return
    }

    // Créer un JSON avec activityId et like (boolean)
    const swipeResults = activities?.map(activity => ({
      activityId: activity.activityId,
      like: likedActivities.includes(activity.activityId)
    })) || []
    
    // Sauvegarder dans le contexte
    setSwipeResults(swipeResults)
    
    console.log("Génération de l'itinéraire avec:", swipeResults)
    
    // Utiliser le premier jour de visite pour start/end time
    const firstDay = state.data.visitDays[0]!
    
    buildItineraryMutation.mutate({
      likesDislikes: swipeResults,
      startTime: firstDay.startTime,
      endTime: firstDay.endTime,
      walkSpeed: state.data.walkingLevel ?? 50,
      maxActivities: 10,
      alpha: 1.0,
      beta: 0.4,
      gamma: 0.5,
      delta: 0.2
    })
  }

  const canContinue = swipeCount >= 10
  const hasMoreCards = activities && currentIndex < activities.length

  if (state.isLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-2 sm:p-4 flex items-center justify-center">
        <div className="text-center">
          <LoaderIcon className="size-8 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Chargement de vos activités...</p>
        </div>
      </div>
    )
  }

  // Dialog d'explication
  if (showWelcomeDialog) {
    return (
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">
              Personnalisez votre itinéraire
            </DialogTitle>
            <DialogDescription className="text-center text-base leading-relaxed">
              Pour créer un itinéraire parfaitement adapté à vos goûts, nous allons vous proposer une sélection d'activités.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="flex justify-center items-center gap-4 mb-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <XIcon className="size-6 text-red-600" />
                  </div>
                  <span className="text-sm text-muted-foreground">Passer</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <HeartIcon className="size-6 text-green-600" />
                  </div>
                  <span className="text-sm text-muted-foreground">J'aime</span>
                </div>
              </div>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Comment ça marche ?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Glissez les cartes vers la gauche ou la droite</li>
                <li>• Ou utilisez les boutons en bas</li>
                <li>• Vos préférences nous aident à personnaliser votre visite</li>
                <li>• Votre itinéraire optimal sera généré après</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={() => setShowWelcomeDialog(false)}
              className="w-full"
            >
              Commencer la sélection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-2 sm:p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur: {state.error}</p>
          <Button onClick={() => window.location.href = "/onboarding"}>
            Retour à l'onboarding
          </Button>
        </div>
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-2 sm:p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Aucune activité disponible</p>
          <Button onClick={() => window.location.href = "/onboarding"}>
            Retour à l'onboarding
          </Button>
        </div>
      </div>
    )
  }

  // Écran de fin ou option de continuer
  if (!hasMoreCards || (canContinue && currentIndex >= activities.length)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-2 sm:p-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <HeartIcon className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Parfait !
          </h1>
          <p className="text-muted-foreground mb-6">
            Vous avez swipé {swipeCount} activités. Voici votre sélection personnalisée.
          </p>
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-green-800 dark:text-green-200">
                Activités aimées ({likedActivities.length})
              </h3>
              <p className="text-sm text-green-600 dark:text-green-300">
                Ces activités seront prioritaires dans votre itinéraire.
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-red-800 dark:text-red-200">
                Activités écartées ({dislikedActivities.length})
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300">
                Ces activités ne seront pas incluses dans votre itinéraire.
              </p>
            </div>
            <Button 
              className="w-full mt-6"
              onClick={handleItineraryClick}
            >
              Itinéraire
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-dvh bg-gradient-to-br from-background to-muted p-2 sm:p-4 relative overflow-hidden">
      {/* SVG en arrière-plan */}
      <img 
        src="/chateau_min.svg" 
        alt="Château de Versailles" 
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 min-h-[50vh] w-full object-cover"
        style={{ width: 'full', minHeight: '50vh' }}
      />
      
      <div className="absolute top-4 right-4 z-30">
        <ModeToggle />
      </div>

      <div className="relative z-10 max-w-sm mx-auto pb-32">
        {/* Indicateur de progression */}
        <div className="w-full bg-muted rounded-full mb-4">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / activities.length) * 100}%` }}
          />
        </div>

        {/* Pile de cartes */}
        <div className="relative h-full mb-5 flex justify-center items-start">
          {/* Carte suivante (arrière-plan) */}
          {activities[currentIndex + 1] && (
            <SwipeableCard
              activity={activities[currentIndex + 1]!}
              onSwipe={() => { }}
              isTop={false}
            />
          )}

          {/* Carte actuelle */}
          {activities[currentIndex] && (
            <SwipeableCard
              activity={activities[currentIndex]!}
              onSwipe={handleSwipe}
              isTop={true}
            />
          )}
        </div>

        {/* Boutons d'action */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-30">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleButtonAction('dislike')}
            className="w-16 h-16 rounded-full border-2 border-red-500 hover:bg-red-500 hover:text-white transition-colors"
            disabled={!hasMoreCards}
          >
            <XIcon className="size-6" />
          </Button>

          {/* Bouton Itinéraire au centre */}
          <Button
            variant="secondary"
            size="lg"
            onClick={handleItineraryClick}
            className={`w-16 h-16 rounded-full transition-colors ${
              canContinue 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            disabled={!canContinue}
          >
            <span className="text-xs font-semibold">Itinéraire</span>
          </Button>

          <Button
            size="lg"
            onClick={() => handleButtonAction('like')}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
            disabled={!hasMoreCards}
          >
            <HeartIcon className="size-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SwipePage() {
  return <SwipePageContent />
}