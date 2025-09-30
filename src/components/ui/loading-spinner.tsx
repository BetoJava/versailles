"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  onComplete?: () => void
}

const loadingMessages = [
  "Calcul de l'alignement des astres...",
  "Consultation des archives royales...",
  "Optimisation de la trajectoire des jardins...",
  "Synchronisation avec les esprits de Versailles...",
  "Calcul des meilleurs angles de vue...",
  "Analyse des flux de visiteurs historiques...",
  "Préparation de l'itinéraire magique...",
  "Finalisation de votre expérience unique..."
]

export function LoadingSpinner({ onComplete }: LoadingSpinnerProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        const nextIndex = prev + 1
        if (nextIndex >= loadingMessages.length) {
          clearInterval(messageInterval)
          // Attendre un peu avant de déclencher onComplete
          setTimeout(() => {
            setIsVisible(false)
            onComplete?.()
          }, 1000)
          return prev
        }
        return nextIndex
      })
    }, 3000) // Change de message toutes les 3 secondes

    return () => clearInterval(messageInterval)
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border rounded-lg p-8 max-w-md mx-4 text-center shadow-lg">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Création de votre itinéraire
            </h3>
            <p className="text-sm text-muted-foreground animate-pulse">
              {loadingMessages[currentMessageIndex]}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
