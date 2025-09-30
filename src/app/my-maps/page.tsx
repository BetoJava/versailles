"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { ModeToggle } from "~/components/ui/mode-toggle"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { X, Clock, Ticket, ExternalLink, Play, Pause, LoaderIcon, List } from "lucide-react"
import { useOnboarding } from "~/contexts/onboarding-context"
import { useRouter } from "next/navigation"
import allActivitiesData from "~/assets/data/activity_v2.json"

interface Activity {
    activityId: string
    name: string
    catchy_description: string | null
    duration: number
    latitude: number
    longitude: number
    openingTime: number
    closingTime: number
    sectionId: string
    url: string
    ticket: string
    "interests.architecture": number
    "interests.landscape": number
    "interests.politic": number
    "interests.history": number
    "interests.courtlife": number
    "interests.art": number
    "interests.engineering": number
    "interests.spirituality": number
    "interests.nature": number
}

// Import dynamique de la carte pour éviter les problèmes SSR avec Leaflet
const MapComponent = dynamic(
    () => import('./MapComponent').then(mod => mod.default),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-muted">
                <p className="text-muted-foreground">Chargement de la carte...</p>
            </div>
        )
    }
)

function MyMapsContent() {
    const { state } = useOnboarding()
    const router = useRouter()
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
    const [hoveredActivity, setHoveredActivity] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [activities, setActivities] = useState<Activity[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Charger les activités depuis le contexte ou le fichier JSON de fallback
    useEffect(() => {
        const loadActivities = async () => {
            try {
                const allActivities = allActivitiesData as Activity[]

                if (state.itinerary?.itinerary && state.itinerary.itinerary.length > 0) {
                    // Si l'itinéraire existe dans le contexte, utiliser les activity_id pour filtrer
                    const orderedActivities = state.itinerary.itinerary
                        .filter(step => step.activity_id)
                        .map(step => {
                            const activity = allActivities.find(a => a.activityId === step.activity_id)
                            return activity
                        })
                        .filter((activity): activity is Activity => activity !== undefined)
                    
                    setActivities(orderedActivities)
                } else {
                    // Fallback: charger depuis itinerary.json
                    const response = await fetch('/src/assets/data/itinerary.json')
                    const fallbackData = await response.json()
                    setActivities(fallbackData as Activity[])
                }
            } catch (error) {
                console.error('Erreur lors du chargement des activités:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadActivities()
    }, [state.itinerary])

    // Fonction pour démarrer/arrêter l'animation
    const togglePlayItinerary = () => {
        if (isPlaying) {
            // Arrêter l'animation
            setIsPlaying(false)
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
        } else {
            // Démarrer l'animation
            if (activities.length > 0) {
                setIsPlaying(true)
                setCurrentIndex(0)
                setSelectedActivity(activities[0]!)
            }
        }
    }

    // Effet pour gérer le parcours automatique
    useEffect(() => {
        if (!isPlaying) return

        if (currentIndex >= activities.length) {
            // Fin de l'itinéraire
            setIsPlaying(false)
            setCurrentIndex(0)
            return
        }

        // Sélectionner l'activité courante
        const currentActivity = activities[currentIndex]
        if (currentActivity) {
            setSelectedActivity(currentActivity)
        }

        // Programmer la prochaine activité après 3 secondes
        timeoutRef.current = setTimeout(() => {
            setCurrentIndex(prev => prev + 1)
        }, 3000)

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [isPlaying, currentIndex, activities])

    // Cleanup à la destruction du composant
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    const formatDuration = (hours: number) => {
        if (hours < 1) return `${Math.round(hours * 60)} min`
        const h = Math.floor(hours)
        const mins = Math.round((hours - h) * 60)
        return mins > 0 ? `${h}h${mins}` : `${h}h`
    }

    const formatTime = (time: number) => {
        const hours = Math.floor(time)
        const minutes = Math.round((time - hours) * 60)
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }

    // Fonction wrapper pour arrêter l'animation lors d'une sélection manuelle
    const handleManualSelection = (activity: Activity | null) => {
        if (isPlaying) {
            setIsPlaying(false)
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
        }
        setSelectedActivity(activity)
    }

    // Afficher un écran de chargement pendant le chargement des activités
    if (isLoading) {
        return (
            <div className="relative h-screen w-screen overflow-hidden bg-background flex items-center justify-center">
                <div className="text-center">
                    <LoaderIcon className="size-8 text-muted-foreground mx-auto mb-4 animate-spin" />
                    <p className="text-muted-foreground">Chargement de la carte...</p>
                </div>
            </div>
        )
    }

    // Afficher un message si aucune activité n'est disponible
    if (activities.length === 0) {
        return (
            <div className="relative h-screen w-screen overflow-hidden bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground">Aucune activité disponible pour l'itinéraire</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-background">
            {/* Carte */}
            <div className="absolute inset-0">
                <MapComponent
                    activities={activities}
                    selectedActivity={selectedActivity}
                    setSelectedActivity={handleManualSelection}
                    hoveredActivity={hoveredActivity}
                />
            </div>

            {/* Bouton de lecture de l'itinéraire (coin supérieur gauche) */}
            <div className="absolute top-4 left-4 z-[1000] pointer-events-auto">
                <Button
                    onClick={togglePlayItinerary}
                    variant="default"
                    size="lg"
                    className="gap-2 shadow-lg"
                >
                    {isPlaying ? (
                        <>
                            <Pause className="size-5" />
                            Arrêter ({currentIndex + 1}/{activities.length})
                        </>
                    ) : (
                        <>
                            <Play className="size-5" />
                            Parcourir l'itinéraire
                        </>
                    )}
                </Button>
            </div>

            {/* Contrôle du mode (coin supérieur droit) */}
            <div className="absolute top-4 right-4 z-[1000] pointer-events-auto flex gap-2">
                <Button
                    onClick={() => router.push('/my-route')}
                    size="icon"
                    variant="outline"
                    className="bg-background/80 backdrop-blur-sm"
                >
                    <List className="size-4" />
                </Button>
                <ModeToggle />
            </div>

            {/* Panel de détails (bottom sheet) */}
            {selectedActivity && (
                <div className="absolute left-0 right-0 bottom-0 z-[1000] pointer-events-none">
                    <Card className="pointer-events-auto bg-background/95 backdrop-blur-sm border-t-2 border-x-0 border-b-0 rounded-t-2xl rounded-b-none overflow-hidden max-h-[45vh]">
                        {/* Header */}
                        <div className="p-4 flex items-start justify-between">
                            <div className="flex-1 pr-2">
                                <h2 className="font-bold text-xl mb-1">
                                    {selectedActivity.name}
                                </h2>
                                {/* Infos en ligne */}
                                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="size-4" />
                                        <span>{formatTime(selectedActivity.openingTime)} - {formatTime(selectedActivity.closingTime)}</span>
                                    </div>
                                    {selectedActivity.duration > 0 && (
                                        <>
                                            <span>•</span>
                                            <span>{formatDuration(selectedActivity.duration)}</span>
                                        </>
                                    )}
                                    <span>•</span>
                                    <div className="flex items-center gap-1.5">
                                        <Ticket className="size-4" />
                                        <span className="capitalize">{selectedActivity.ticket}</span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setSelectedActivity(null)
                                    // Arrêter l'animation si elle est en cours
                                    if (isPlaying) {
                                        setIsPlaying(false)
                                        if (timeoutRef.current) {
                                            clearTimeout(timeoutRef.current)
                                            timeoutRef.current = null
                                        }
                                    }
                                }}
                                className="flex-shrink-0"
                            >
                                <X className="size-4" />
                            </Button>
                        </div>

                        {/* Content scrollable */}
                        <div className="overflow-y-auto max-h-[calc(45vh-100px)]">
                            <div className="flex flex-col sm:flex-row gap-4 px-4 pb-4">
                                {/* Image */}
                                {selectedActivity.activityId && (
                                    <div className="relative w-full sm:w-64 h-40 sm:h-48 flex-shrink-0 rounded-lg overflow-hidden">
                                        <img
                                            src={`/activity_images/${selectedActivity.activityId}.jpg`}
                                            alt={selectedActivity.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.style.display = 'none'
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Description et bouton */}
                                <div className="flex-1 space-y-3">
                                    {selectedActivity.catchy_description && (
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {selectedActivity.catchy_description}
                                        </p>
                                    )}

                                    {selectedActivity.url && (
                                        <Button
                                            variant="outline"
                                            className="w-full sm:w-auto gap-2"
                                            onClick={() => window.open(selectedActivity.url, '_blank')}
                                        >
                                            <ExternalLink className="size-4" />
                                            Plus d'informations
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}

export default function MyMapsPage() {
    return <MyMapsContent />
}