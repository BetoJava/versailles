"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { ModeToggle } from "~/components/ui/mode-toggle"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { X, MapPin, Clock, Ticket, ExternalLink } from "lucide-react"
import activityData from "~/assets/data/itinerary.json"

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
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
    const [hoveredActivity, setHoveredActivity] = useState<string | null>(null)
    
    const activities = activityData as Activity[]

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

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-background">
            {/* Carte */}
            <div className="absolute inset-0">
                <MapComponent
                    activities={activities}
                    selectedActivity={selectedActivity}
                    setSelectedActivity={setSelectedActivity}
                    hoveredActivity={hoveredActivity}
                />
            </div>

            {/* Contrôle du mode (coin supérieur droit) */}
            <div className="absolute top-4 right-4 z-[1000] pointer-events-auto">
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
                                onClick={() => setSelectedActivity(null)}
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