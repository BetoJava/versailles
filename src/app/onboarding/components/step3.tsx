"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { LoadingSpinner } from "~/components/ui/loading-spinner"
import { HeartIcon, ChevronLeftIcon } from "lucide-react"

interface VisitDay {
  id: string
  date: string
  startTime: string
  endTime: string
}

interface Handicaps {
  mobilite: boolean
  vision: boolean
  audition: boolean
}

interface FormData {
  hasChildren: boolean
  walkingLevel: number
  handicaps: Handicaps
  visitDays: VisitDay[]
  preferences: string
}

interface Step3Props {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  onBack: () => void
  onFinish: () => void
}

export function Step3({ formData, setFormData, onBack, onFinish }: Step3Props) {
  const [isLoading, setIsLoading] = useState(false)

  const handleFinish = async () => {
    setIsLoading(true)
    // Le loader se fermera automatiquement après 12 secondes
  }

  const handleLoadingComplete = () => {
    setIsLoading(false)
    onFinish()
  }

  return (
    <>
      {isLoading && <LoadingSpinner onComplete={handleLoadingComplete} />}
      <div className="space-y-6 max-w-lg mx-auto">
      <div className="">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          3. Vos préférences
        </h2>
        <p className="text-muted-foreground">
          Pour personnaliser votre expérience, dites-nous vos préférences, ou autres détails importants à prendre en compte dans l'élaboration de votre itinéraire.
        </p>
      </div>

      <div className="space-y-4">
        <Label htmlFor="preferences" className="text-lg">
          Décrivez vos préférences et besoins spécifiques
        </Label>
        <Textarea
          id="preferences"
          placeholder="Par exemple : J'aimerais voir les jardins, je suis passionné d'histoire, j'aimerais des bons spots photo, je préfère les visites guidées..."
          value={formData.preferences}
          onChange={(e) => setFormData({
            ...formData,
            preferences: e.target.value,
          })}
          className="min-h-[200px] resize-none"
        />
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ChevronLeftIcon className="mr-2 size-4" />
          Précédent
        </Button>
        <Button
          onClick={handleFinish}
          disabled={isLoading}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
        >
          <HeartIcon className="mr-2 size-4" />
          Créer mon itinéraire
        </Button>
      </div>
      </div>
    </>
  )
}
