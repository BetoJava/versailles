"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Checkbox } from "~/components/ui/checkbox"
import { Card } from "~/components/ui/card"
import { PlusIcon, MinusIcon, ClockIcon, MapPinIcon, UsersIcon, AccessibilityIcon } from "lucide-react"

interface ParticipantAge {
  id: string
  age: string
}

interface Handicaps {
  mobilite: boolean
  vision: boolean
  audition: boolean
}

interface FormData {
  participants: ParticipantAge[]
  handicaps: Handicaps
  dureeVisite: string
  heureDebut: string
  heureFin: string
  entree: string
}

const DUREES_VISITE = [
  { value: "1", label: "1 heure" },
  { value: "1.5", label: "1h30" },
  { value: "2", label: "2 heures" },
  { value: "2.5", label: "2h30" },
  { value: "3", label: "3 heures" },
  { value: "4", label: "4 heures" },
  { value: "5", label: "5 heures" },
]

const ENTREES_CHATEAU = [
  { value: "principale", label: "Entrée Principale - Cour d'Honneur" },
  { value: "reine", label: "Entrée de la Reine - Cour de Marbre" },
  { value: "jardins", label: "Entrée des Jardins - Grille de la Reine" },
  { value: "trianon", label: "Entrée Trianon - Grand Trianon" },
]

function calculateEndTime(startTime: string, duration: string): string {
  if (!startTime || !duration) return ""
  
  const [hours, minutes] = startTime.split(":").map(Number)
  const durationHours = parseFloat(duration)
  
  const totalMinutes = hours * 60 + minutes + durationHours * 60
  const endHours = Math.floor(totalMinutes / 60)
  const endMinutes = totalMinutes % 60
  
  return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`
}

export default function OnboardingPage() {
  const [formData, setFormData] = useState<FormData>({
    participants: [{ id: "1", age: "" }],
    handicaps: {
      mobilite: false,
      vision: false,
      audition: false,
    },
    dureeVisite: "",
    heureDebut: "",
    heureFin: "",
    entree: "",
  })

  const addParticipant = () => {
    const newParticipant: ParticipantAge = {
      id: Date.now().toString(),
      age: "",
    }
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, newParticipant],
    }))
  }

  const removeParticipant = (id: string) => {
    if (formData.participants.length > 1) {
      setFormData(prev => ({
        ...prev,
        participants: prev.participants.filter(p => p.id !== id),
      }))
    }
  }

  const updateParticipantAge = (id: string, age: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map(p =>
        p.id === id ? { ...p, age } : p
      ),
    }))
  }

  const updateHandicap = (type: keyof Handicaps, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      handicaps: {
        ...prev.handicaps,
        [type]: checked,
      },
    }))
  }

  const updateTimeAndDuration = (field: "dureeVisite" | "heureDebut", value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Recalculate end time when duration or start time changes
      if (field === "dureeVisite" || field === "heureDebut") {
        updated.heureFin = calculateEndTime(
          field === "heureDebut" ? value : prev.heureDebut,
          field === "dureeVisite" ? value : prev.dureeVisite
        )
      }
      
      return updated
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form data:", formData)
    // Here you would typically send the data to your backend
  }

  const isFormValid = () => {
    return (
      formData.participants.every(p => p.age && parseInt(p.age) > 0) &&
      formData.dureeVisite &&
      formData.heureDebut &&
      formData.entree
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Préparez votre visite
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Château de Versailles - Informations personnalisées
          </p>
        </div>

        <Card className="p-6 shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section Participants */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <UsersIcon className="size-5 text-amber-600" />
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  Participants
                </h2>
              </div>
              
              <div className="space-y-3">
                {formData.participants.map((participant, index) => (
                  <div key={participant.id} className="flex items-center gap-3">
                    <Label className="min-w-0 flex-shrink-0">
                      Âge {index + 1}:
                    </Label>
                    <Input
                      type="number"
                      placeholder="Âge"
                      value={participant.age}
                      onChange={(e) => updateParticipantAge(participant.id, e.target.value)}
                      className="w-20"
                      min="1"
                      max="120"
                    />
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addParticipant}
                        className="p-2"
                      >
                        <PlusIcon className="size-4" />
                      </Button>
                      {formData.participants.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeParticipant(participant.id)}
                          className="p-2"
                        >
                          <MinusIcon className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section Accessibilité */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <AccessibilityIcon className="size-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  Besoins d'accessibilité
                </h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mobilite"
                    checked={formData.handicaps.mobilite}
                    onCheckedChange={(checked) => updateHandicap("mobilite", checked as boolean)}
                  />
                  <Label htmlFor="mobilite">Mobilité réduite</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vision"
                    checked={formData.handicaps.vision}
                    onCheckedChange={(checked) => updateHandicap("vision", checked as boolean)}
                  />
                  <Label htmlFor="vision">Déficience visuelle</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="audition"
                    checked={formData.handicaps.audition}
                    onCheckedChange={(checked) => updateHandicap("audition", checked as boolean)}
                  />
                  <Label htmlFor="audition">Déficience auditive</Label>
                </div>
              </div>
            </div>

            {/* Section Horaires */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <ClockIcon className="size-5 text-green-600" />
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  Planification de la visite
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duree">Durée prévue</Label>
                  <Select
                    value={formData.dureeVisite}
                    onValueChange={(value) => updateTimeAndDuration("dureeVisite", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir la durée" />
                    </SelectTrigger>
                    <SelectContent>
                      {DUREES_VISITE.map((duree) => (
                        <SelectItem key={duree.value} value={duree.value}>
                          {duree.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="heureDebut">Heure de début</Label>
                  <Input
                    id="heureDebut"
                    type="time"
                    value={formData.heureDebut}
                    onChange={(e) => updateTimeAndDuration("heureDebut", e.target.value)}
                    min="09:00"
                    max="17:00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="heureFin">Heure de fin</Label>
                  <Input
                    id="heureFin"
                    type="time"
                    value={formData.heureFin}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* Section Entrée */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPinIcon className="size-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  Point d'entrée
                </h2>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="entree">Entrée du château</Label>
                <Select
                  value={formData.entree}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, entree: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une entrée" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTREES_CHATEAU.map((entree) => (
                      <SelectItem key={entree.value} value={entree.value}>
                        {entree.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bouton de validation */}
            <div className="pt-6">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3"
                disabled={!isFormValid()}
              >
                Commencer ma visite personnalisée
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
