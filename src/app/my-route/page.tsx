"use client"

import { useState, useEffect, useRef } from "react"
import { OnboardingProvider, useOnboarding } from "~/contexts/onboarding-context"
import { ModeToggle } from "~/components/ui/mode-toggle"
import { Button } from "~/components/ui/button"
import { ChevronDown, ChevronUp, Download, LoaderIcon } from "lucide-react"

interface TimelineItemProps {
    step: {
        order: number
        activity_id?: string
        activity_name: string
        arrival_time: string
        departure_time: string
        duration: number
        waiting_time: number
        travel_time_from_previous: number
    }
    isLast: boolean
    isInView: boolean
}

function TimelineItem({ step, isLast, isInView }: TimelineItemProps) {
    const [isOpen, setIsOpen] = useState(false)

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${Math.round(minutes)} min`
        const hours = Math.floor(minutes / 60)
        const mins = Math.round(minutes % 60)
        return mins > 0 ? `${hours}h${mins}` : `${hours}h`
    }

    const isStartOrEnd = step.order === 0 || step.duration === 0

    return (
        <div className="relative">
            <div className="flex items-start gap-4">
                {/* Timeline Point and Line */}
                <div className="flex flex-col items-center h-full">
                    <div
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                            isInView
                                ? 'bg-primary border-primary'
                                : 'bg-background border-muted-foreground'
                        }`}
                    />
                    {!isLast && (
                        <div
                            className={`w-0.5 h-16 transition-all duration-300 ${
                                isInView ? 'bg-primary' : 'bg-muted'
                            }`}
                        />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div
                        className={`${!isStartOrEnd ? 'cursor-pointer hover:bg-muted/50' : ''} rounded-lg p-3 transition-colors`}
                        onClick={() => !isStartOrEnd && setIsOpen(!isOpen)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{step.arrival_time}</span>
                                {step.duration > 0 && (
                                    <span className="text-xs">({formatDuration(step.duration)})</span>
                                )}
                            </div>
                            {!isStartOrEnd && (
                                <div className="flex items-center gap-2">
                                    {isOpen ? (
                                        <ChevronUp className="size-4" />
                                    ) : (
                                        <ChevronDown className="size-4" />
                                    )}
                                </div>
                            )}
                        </div>

                        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                            {step.activity_name}
                        </h3>

                        {step.travel_time_from_previous > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                                🚶 {formatDuration(step.travel_time_from_previous)} de marche
                            </p>
                        )}
                    </div>

                    {/* Expanded Content */}
                    {isOpen && !isStartOrEnd && (
                        <div className="mt-4 space-y-4 pl-3">
                            {step.activity_id && (
                                <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden">
                                    <img
                                        src={`/activity_images/${step.activity_id}.jpg`}
                                        alt={step.activity_name}
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
    const { state, setItinerary } = useOnboarding()
    const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set())
    const containerRef = useRef<HTMLDivElement>(null)

    // Charger l'itinéraire fictif au montage du composant
    useEffect(() => {
        if (!state.itinerary) {
            // Charger l'itinéraire fictif depuis le fichier JSON
            fetch('/src/assets/data/sample-itinerary.json')
                .then(response => response.json())
                .then(data => {
                    setItinerary(data)
                })
                .catch(error => {
                    console.error('Erreur lors du chargement de l\'itinéraire fictif:', error)
                })
        }
    }, [state.itinerary, setItinerary])

    const itinerary = state.itinerary

    useEffect(() => {
        if (!itinerary) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const orderStr = entry.target.getAttribute('data-order')
                    if (orderStr) {
                        const order = parseInt(orderStr)
                        setVisibleItems(prev => {
                            const newSet = new Set(prev)
                            if (entry.isIntersecting) {
                                newSet.add(order)
                            } else {
                                newSet.delete(order)
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

        const timelineItems = containerRef.current?.querySelectorAll('[data-order]')
        timelineItems?.forEach(item => observer.observe(item))

        return () => observer.disconnect()
    }, [itinerary])

    const handleDownload = () => {
        console.log("Téléchargement en cours...")
    }

    if (!itinerary) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background to-muted p-2 sm:p-4 flex items-center justify-center">
                <div className="text-center">
                    <LoaderIcon className="size-8 text-muted-foreground mx-auto mb-4 animate-spin" />
                    <p className="text-muted-foreground">Chargement de votre itinéraire...</p>
                </div>
            </div>
        )
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
                        Votre visite de Versailles
                    </h1>
                    <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
                        Un parcours personnalisé à travers l'histoire et la splendeur du Château de Versailles, adapté à vos préférences.
                    </p>
                    <div className="flex flex-col sm:flex-row items-start gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">
                            Départ : {itinerary.departure_time}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="font-medium">
                            Retour : {itinerary.arrival_time}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>
                            {itinerary.total_activities} activité{itinerary.total_activities > 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-card rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">
                            {Math.round(itinerary.stats.total_visit_time)}
                        </p>
                        <p className="text-xs text-muted-foreground">min de visite</p>
                    </div>
                    <div className="bg-card rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">
                            {Math.round(itinerary.stats.total_travel_time)}
                        </p>
                        <p className="text-xs text-muted-foreground">min de marche</p>
                    </div>
                    <div className="bg-card rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">
                            {Math.round(itinerary.total_duration)}
                        </p>
                        <p className="text-xs text-muted-foreground">min total</p>
                    </div>
                </div>

                {/* Timeline */}
                <div className="space-y-0 mb-8">
                    {itinerary.itinerary.map((step, index) => (
                        <div key={step.order} data-order={step.order}>
                            <TimelineItem
                                step={step}
                                isLast={index === itinerary.itinerary.length - 1}
                                isInView={visibleItems.has(step.order)}
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