"use client"

import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Checkbox } from "~/components/ui/checkbox"
import { Slider } from "~/components/ui/slider"
import { AccessibilityIcon, ChevronRightIcon, FootprintsIcon, Rabbit, Snail, Turtle } from "lucide-react"

interface Handicaps {
  mobilite: boolean
  vision: boolean
  audition: boolean
}

interface VisitDay {
  id: string
  date: string
  startTime: string
  endTime: string
}

interface FormData {
  hasChildren: boolean
  walkingLevel: number
  handicaps: Handicaps
  visitDays: VisitDay[]
  preferences: string
}

const WALKING_LEVELS = {
  min: <Snail />,
  middle: <Turtle />,
  max: <Rabbit />,
}

interface Step1Props {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  onNext: () => void
}

export function Step1({ formData, setFormData, onNext }: Step1Props) {
  const updateHandicap = (type: keyof Handicaps, checked: boolean) => {
    setFormData({
      ...formData,
      handicaps: {
        ...formData.handicaps,
        [type]: checked,
      },
    })
  }

  const updateWalkingLevel = (value: number[]) => {
    setFormData({
      ...formData,
      walkingLevel: value[0] ?? 0,
    })
  }

  return (
    <div className="space-y-8 sm:space-y-6 max-w-lg mx-auto">
      <div className="">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          1. Parlez-nous de vous
        </h2>
        <p className="text-muted-foreground">
          Pour personnaliser votre expérience au château de Versailles
        </p>
      </div>

      <div className="space-y-8 sm:space-y-6 mt-10">
        {/* Enfants */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasChildren"
              checked={formData.hasChildren}
              onCheckedChange={(checked) => setFormData({
                ...formData,
                hasChildren: checked as boolean,
              })}
            />
            <Label htmlFor="hasChildren" className="text-lg cursor-pointer">
              Venez-vous avec des enfants ?
            </Label>
          </div>
        </div>

        {/* Niveau de marche */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FootprintsIcon className="size-5 text-green-600" />
            <Label className="text-lg">Votre vitesse de marche</Label>
          </div>
          <div className="px-3">
            <Slider
              value={[formData.walkingLevel]}
              onValueChange={updateWalkingLevel}
              max={50}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>{WALKING_LEVELS.min}</span>
              <span>{WALKING_LEVELS.max}</span>
            </div>
            <div className="flex items-center justify-center mt-2">
              <span className="text-sm font-medium">
                {formData.walkingLevel < 17 ? WALKING_LEVELS.min : formData.walkingLevel < 33 ? WALKING_LEVELS.middle : WALKING_LEVELS.max}
              </span>
            </div>
          </div>
        </div>

        {/* Accessibilité */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AccessibilityIcon className="size-5 text-blue-600" />
            <Label className="text-lg">Besoins d'accessibilité</Label>
          </div>
          
          <div className="space-y-3 pl-7">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mobilite"
                checked={formData.handicaps.mobilite}
                onCheckedChange={(checked) => updateHandicap("mobilite", checked as boolean)}
              />
              <Label htmlFor="mobilite" className="cursor-pointer">Mobilité réduite</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="vision"
                checked={formData.handicaps.vision}
                onCheckedChange={(checked) => updateHandicap("vision", checked as boolean)}
              />
              <Label htmlFor="vision" className="cursor-pointer">Déficience visuelle</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="audition"
                checked={formData.handicaps.audition}
                onCheckedChange={(checked) => updateHandicap("audition", checked as boolean)}
              />
              <Label htmlFor="audition" className="cursor-pointer">Déficience auditive</Label>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={onNext} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
        Suivant
        <ChevronRightIcon className="ml-2 size-4" />
      </Button>
    </div>
  )
}
