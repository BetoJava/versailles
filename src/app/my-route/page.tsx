"use client"

import { useState, useEffect, useRef } from "react"
import { useOnboarding } from "~/contexts/onboarding-context"
import { ModeToggle } from "~/components/ui/mode-toggle"
import { Button } from "~/components/ui/button"
import { ChevronDown, ChevronUp, Download, LoaderIcon, Map } from "lucide-react"
import { useRouter } from "next/navigation"

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
        description: string
    }
    isLast: boolean
    isInView: boolean
}

function TimelineItem({ step, isLast, isInView }: TimelineItemProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [imageError, setImageError] = useState(false)

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
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${isInView
                            ? 'bg-primary border-primary'
                            : 'bg-background border-muted-foreground'
                            }`}
                    />
                    {!isLast && (
                        <div
                            className={`w-0.5 h-16 transition-all duration-300 ${isInView ? 'bg-primary' : 'bg-muted-foreground'
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
                        <>
                            <div className=" space-y-4 pl-3">
                                {step.activity_id && !imageError && (
                                    <div className="mt-4 relative w-full h-48 sm:h-64 rounded-lg overflow-hidden">
                                        <img
                                            src={`/activity_images/${step.activity_id}.jpg`}
                                            alt={step.activity_name}
                                            className="w-full h-full object-cover"
                                            onError={() => setImageError(true)}
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                {step.description && (
                                    <p className="text-sm text-muted-foreground leading-relaxed pl-3 py-2">
                                        {step.description}
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

function MyRouteContent() {
    const { state } = useOnboarding()
    const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set())
    const containerRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    // L'itinéraire vient directement du contexte
    // Il est créé après le swipe des activités via l'API itinerary
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

    const handleDownload = async () => {
        if (!itinerary) return

        try {
            // Importation dynamique de jsPDF
            const { jsPDF } = await import('jspdf')

            const doc = new jsPDF()
            const pageWidth = doc.internal.pageSize.getWidth()
            const margin = 20
            let yPosition = margin

            // Titre
            doc.setFontSize(22)
            doc.setFont('helvetica', 'bold')
            doc.text('Votre visite de Versailles', margin, yPosition)
            yPosition += 10

            // Sous-titre
            doc.setFontSize(12)
            doc.setFont('helvetica', 'normal')
            doc.text('Un parcours personnalisé à travers l\'histoire et la splendeur', margin, yPosition)
            yPosition += 6
            doc.text('du Château de Versailles', margin, yPosition)
            yPosition += 12

            // Informations générales
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.text(`Départ: ${itinerary.departure_time}`, margin, yPosition)
            doc.text(`Retour: ${itinerary.arrival_time}`, pageWidth / 2 + 10, yPosition)
            yPosition += 6
            doc.text(`${itinerary.total_activities} activité${itinerary.total_activities > 1 ? 's' : ''}`, margin, yPosition)
            yPosition += 15

            // Ligne de séparation
            doc.setDrawColor(200, 200, 200)
            doc.line(margin, yPosition, pageWidth - margin, yPosition)
            yPosition += 10

            // Itinéraire
            doc.setFontSize(16)
            doc.setFont('helvetica', 'bold')
            doc.text('Itinéraire', margin, yPosition)
            yPosition += 10

            // Helper pour formater la durée
            const formatDuration = (minutes: number) => {
                if (minutes < 60) return `${Math.round(minutes)} min`
                const hours = Math.floor(minutes / 60)
                const mins = Math.round(minutes % 60)
                return mins > 0 ? `${hours}h${mins}` : `${hours}h`
            }

            // Parcourir chaque étape
            itinerary.itinerary.forEach((step, index) => {
                // Vérifier si on doit ajouter une nouvelle page
                if (yPosition > 270) {
                    doc.addPage()
                    yPosition = margin
                }

                doc.setFontSize(12)
                doc.setFont('helvetica', 'bold')

                // Numéro et heure
                const stepNumber = step.order === 0 ? 'Départ' :
                    step.duration === 0 ? 'Arrivée' :
                        `Étape ${step.order}`
                doc.text(`${stepNumber} - ${step.arrival_time}`, margin, yPosition)
                yPosition += 6

                // Nom de l'activité
                doc.setFontSize(11)
                doc.setFont('helvetica', 'normal')
                const activityText = doc.splitTextToSize(step.activity_name, pageWidth - 2 * margin)
                doc.text(activityText, margin + 5, yPosition)
                yPosition += 6 * activityText.length

                // Durée de visite
                if (step.duration > 0) {
                    doc.setFontSize(9)
                    doc.setTextColor(100, 100, 100)
                    doc.text(`Durée de visite: ${formatDuration(step.duration)}`, margin + 5, yPosition)
                    yPosition += 5
                }

                // Temps de marche
                if (step.travel_time_from_previous > 0) {
                    doc.setFontSize(9)
                    doc.setTextColor(100, 100, 100)
                    doc.text(`🚶 ${formatDuration(step.travel_time_from_previous)} de marche`, margin + 5, yPosition)
                    yPosition += 5
                }

                doc.setTextColor(0, 0, 0)
                yPosition += 5

                // Ligne de séparation légère entre les étapes
                if (index < itinerary.itinerary.length - 1) {
                    doc.setDrawColor(230, 230, 230)
                    doc.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition)
                    yPosition += 8
                }
            })

            // Pied de page sur chaque page
            const totalPages = doc.getNumberOfPages()
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i)
                doc.setFontSize(8)
                doc.setTextColor(150, 150, 150)
                doc.text(
                    `Généré le ${new Date().toLocaleDateString('fr-FR')} - Page ${i}/${totalPages}`,
                    pageWidth / 2,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: 'center' }
                )
            }

            // Télécharger le PDF
            doc.save(`itineraire-versailles-${new Date().toISOString().split('T')[0]}.pdf`)
        } catch (error) {
            console.error('Erreur lors de la génération du PDF:', error)
            alert('Une erreur est survenue lors de la génération du PDF')
        }
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
            className="min-h-screen bg-background p-3 sm:p-4 relative"
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

            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex gap-2 z-100">
                <ModeToggle />
            </div>

            <div className="relative z-10 max-w-xl mx-auto py-8 px-2 sm:px-4" ref={containerRef}>
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 mt-8 sm:mt-0">
                        Votre visite de Versailles
                    </h1>
                    <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
                        Un parcours personnalisé à travers l'histoire et la splendeur du Château de Versailles, adapté à vos préférences.
                    </p>
                    <Button
                        onClick={() => router.push('/my-maps')}
                        className="w-full mb-6"
                    >
                        <Map className="size-4" />
                        Voir mon itinéraire
                    </Button>
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
                {/* <div className="grid grid-cols-3 gap-4 mb-8">
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
                </div> */}

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
                <div>
                    <p className="text-muted-foreground mt-48 mb-6 text-xs">
                        Application réalisée par l'équipe des joueurs de Paume, équipe championne du monde du jeu de paume 2015, aux JO Paris.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function MyRoutePage() {
    return <MyRouteContent />
}