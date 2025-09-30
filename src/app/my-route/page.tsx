"use client"

import { useState, useEffect, useRef } from "react"
import { OnboardingProvider, useOnboarding } from "~/contexts/onboarding-context"
import { ModeToggle } from "~/components/ui/mode-toggle"
import { Button } from "~/components/ui/button"
import { ChevronDown, ChevronUp, Heart, UtensilsCrossed, Download } from "lucide-react"

interface Activity {
    id: string
    name: string
    description: string
    type: "activity" | "business"
    startTime: string // datetime format: 2025-09-29T09:00:00
    endTime: string   // datetime format: 2025-09-29T11:30:00
    duration: number // in minutes
    businessName?: string // for business type activities
}

interface Itinerary {
    title: string
    description: string
    dateTimeRanges: string[] // ["29/09/2025-09:00", "30/09/2025-09:30"]
    activities: Activity[]
}

// Mock data
const mockItinerary: Itinerary = {
    title: "Votre visite royale de Versailles",
    description: "Un parcours personnalisé à travers l'histoire et la splendeur du Château de Versailles, adapté à vos préférences et contraintes.",
    dateTimeRanges: ["29/09/2025-09:00", "29/09/2025-18:00", "30/09/2025-09:30", "30/09/2025-17:30"],
    activities: [
        {
            id: "1",
            name: "Château de Versailles",
            description: "Découvrez la résidence royale emblématique et son architecture majestueuse. Explorez les appartements du Roi et de la Reine, et admirez la richesse du mobilier d'époque.",
            type: "activity",
            startTime: "2025-09-29T09:00:00",
            endTime: "2025-09-29T11:30:00",
            duration: 150
        },
        {
            id: "2",
            name: "Galerie des Glaces",
            description: "La pièce la plus célèbre du château, avec ses 357 miroirs qui reflètent la lumière des fenêtres donnant sur les jardins. Un chef-d'œuvre du baroque français.",
            type: "activity",
            startTime: "2025-09-29T11:30:00",
            endTime: "2025-09-29T12:15:00",
            duration: 45
        },
        {
            id: "meal-1",
            name: "Pause déjeuner",
            description: "Déjeuner au restaurant La Flottille, situé dans le parc du château.",
            type: "business",
            businessName: "Restaurant La Flottille",
            startTime: "2025-09-29T12:30:00",
            endTime: "2025-09-29T13:30:00",
            duration: 60
        },
        {
            id: "3",
            name: "Jardins de Versailles",
            description: "Promenez-vous dans les jardins à la française conçus par André Le Nôtre. Découvrez les parterres géométriques, les fontaines et les sculptures.",
            type: "activity",
            startTime: "2025-09-29T14:00:00",
            endTime: "2025-09-29T16:00:00",
            duration: 120
        },
        {
            id: "4",
            name: "Petit Trianon",
            description: "Le refuge intime de Marie-Antoinette, loin de l'étiquette de la cour. Un chef-d'œuvre de l'architecture néoclassique entouré de jardins pittoresques.",
            type: "activity",
            startTime: "2025-09-29T16:15:00",
            endTime: "2025-09-29T17:30:00",
            duration: 75
        },
        {
            id: "5",
            name: "Grand Trianon",
            description: "Le palais de marbre rose et porphyre construit par Louis XIV pour échapper à l'étiquette de la cour. Architecture italienne élégante et jardins somptueux.",
            type: "activity",
            startTime: "2025-09-30T09:30:00",
            endTime: "2025-09-30T11:00:00",
            duration: 90
        },
        {
            id: "6",
            name: "Hameau de la Reine",
            description: "Le village rustique créé pour Marie-Antoinette où elle jouait à la bergère. Une évasion bucolique et romantique au cœur du domaine.",
            type: "activity",
            startTime: "2025-09-30T11:15:00",
            endTime: "2025-09-30T12:30:00",
            duration: 75
        },
        {
            id: "meal-2",
            name: "Pause déjeuner",
            description: "Déjeuner au restaurant Ore - Ducasse au Château, expérience gastronomique d'exception.",
            type: "business",
            businessName: "Ore - Ducasse au Château",
            startTime: "2025-09-30T13:00:00",
            endTime: "2025-09-30T14:30:00",
            duration: 90
        }
    ]
}

// Mock list of swiped/liked activity IDs
const mockSwipedActivities = ["1", "3", "4"]

interface TimelineItemProps {
    activity: Activity
    isLast: boolean
    isInView: boolean
}

function TimelineItem({ activity, isLast, isInView }: TimelineItemProps) {
    const [isOpen, setIsOpen] = useState(false)
    const itemRef = useRef<HTMLDivElement>(null)

    const formatDuration = (minutes: number) => {
        if (minutes < 60) {
            return `${minutes} min`
        }
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return mins > 0 ? `${hours}h${mins}` : `${hours}h`
    }

    const formatTime = (datetime: string) => {
        const date = new Date(datetime)
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatDate = (datetime: string) => {
        const date = new Date(datetime)
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        })
    }

    const isNewDay = (currentDateTime: string, activities: Activity[], currentIndex: number) => {
        if (currentIndex === 0) return true
        const currentDate = new Date(currentDateTime).toDateString()
        const prevDate = new Date(activities[currentIndex - 1]!.startTime).toDateString()
        return currentDate !== prevDate
    }

    const currentIndex = mockItinerary.activities.findIndex(a => a.id === activity.id)
    const showDateHeader = isNewDay(activity.startTime, mockItinerary.activities, currentIndex)

    return (
        <div ref={itemRef} className="relative">
            {/* Date Header */}
            {showDateHeader && (
                <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                        {formatDate(activity.startTime)}
                    </h2>
                </div>
            )}

            <div className="flex items-start gap-4">
                {/* Timeline Point and Line */}
                <div className="flex flex-col items-center h-full">
                    <div
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${isInView
                                ? 'bg-primary border-primary'
                                : 'bg-background border-muted-foreground'
                            }`}
                    />
                    {!isLast && (
                        <div
                            className={`w-0.5 h-16 transition-all duration-300 ${isInView ? 'bg-primary' : 'bg-muted'
                                }`}
                        />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div
                        className="cursor-pointer hover:bg-muted/50 rounded-lg p-3 transition-colors"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{formatTime(activity.startTime)}</span>
                                <span className="text-xs">({formatDuration(activity.duration)})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isOpen ? (
                                    <ChevronUp className="size-4" />
                                ) : (
                                    <ChevronDown className="size-4" />
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-1">
                            {activity.type === "business" ? (
                                <UtensilsCrossed className="size-4 text-amber-600" />
                            ) : null}
                            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                {activity.type === "business" ? activity.businessName : activity.name}
                            </h3>
                        </div>
                    </div>

                    {/* Expanded Content */}
                    {isOpen && (
                        <div className="mt-4 space-y-4 pl-3">
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                            {activity.type === "activity" && (
                                <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden">
                                    <img
                                        src={`/activity_images/${activity.id}.jpg`}
                                        alt={activity.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.style.display = 'none'
                                            const parent = target.parentElement
                                            if (parent) {
                                                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-muted rounded-lg"><p class="text-muted-foreground">Image non disponible</p></div>'
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function MyRouteContent() {
    const { state } = useOnboarding()
    const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set())
    const containerRef = useRef<HTMLDivElement>(null)

    const swipedActivities = state.swipedActivities.length > 0
        ? state.swipedActivities
        : mockSwipedActivities

    // Intersection Observer for timeline points
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const id = entry.target.getAttribute('data-activity-id')
                    if (id) {
                        setVisibleItems(prev => {
                            const newSet = new Set(prev)
                            if (entry.isIntersecting) {
                                newSet.add(id)
                            } else {
                                newSet.delete(id)
                            }
                            return newSet
                        })
                    }
                })
            },
            {
                root: null,
                rootMargin: '-20% 0px -60% 0px',
                threshold: 0
            }
        )

        const timelineItems = containerRef.current?.querySelectorAll('[data-activity-id]')
        timelineItems?.forEach(item => observer.observe(item))

        return () => observer.disconnect()
    }, [])

    const handleDownload = () => {
        // TODO: Implement PDF download functionality
        console.log("Téléchargement en cours...")
    }

    return (
        <div
            className="min-h-screen bg-background p-1 sm:p-4 relative"
            style={{
                backgroundColor: 'var(--color-background)'
            }}
        >
            {/* SVG en arrière-plan */}
            <img
                src="/chateau_min.svg"
                alt="Château de Versailles"
                className="fixed bottom-0 left-1/2 transform -translate-x-1/2 min-h-[50vh] w-full object-cover pointer-events-none"
                style={{ width: 'full', minHeight: '50vh' }}
            />

            <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                <ModeToggle />
            </div>

            <div className="relative z-10 max-w-xl mx-auto py-8 px-2 sm:px-4" ref={containerRef}>
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                        {mockItinerary.title}
                    </h1>
                    <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
                        {mockItinerary.description}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">
                            {mockItinerary.dateTimeRanges.length > 0 &&
                                `Du ${mockItinerary.dateTimeRanges[0]?.split('-')[0]} au ${mockItinerary.dateTimeRanges[mockItinerary.dateTimeRanges.length - 1]?.split('-')[0]}`
                            }
                        </span>
                    </div>
                </div>

                {/* Timeline */}
                <div className="space-y-0 mb-8">
                    {mockItinerary.activities.map((activity, index) => (
                        <div key={activity.id} data-activity-id={activity.id}>
                            <TimelineItem
                                activity={activity}
                                isLast={index === mockItinerary.activities.length - 1}
                                isInView={visibleItems.has(activity.id)}
                            />
                        </div>
                    ))}
                </div>

                {/* Download Button */}
                <div className="flex justify-center">
                    <Button
                        onClick={handleDownload}
                        size="lg"
                        className="gap-2"
                    >
                        <Download className="size-5" />
                        Télécharger l'itinéraire (PDF)
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default function MyRoutePage() {
    return (
        <OnboardingProvider>
            <MyRouteContent />
        </OnboardingProvider>
    )
}
