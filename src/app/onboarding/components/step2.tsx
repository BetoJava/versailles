"use client"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Card } from "~/components/ui/card"
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

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

interface Step2Props {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  onNext: () => void
  onBack: () => void
}

export function Step2({ formData, setFormData, onNext, onBack }: Step2Props) {
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0] || ""
  }

  const getCurrentTime = () => {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const addVisitDay = () => {
    const newDay: VisitDay = {
      id: Date.now().toString(),
      date: getCurrentDate(),
      startTime: getCurrentTime(),
      endTime: "",
    }
    setFormData({
      ...formData,
      visitDays: [...formData.visitDays, newDay],
    })
  }

  const updateVisitDay = (id: string, field: keyof Omit<VisitDay, 'id'>, value: string) => {
    setFormData({
      ...formData,
      visitDays: formData.visitDays.map(day =>
        day.id === id ? { ...day, [field]: value } : day
      ),
    })
  }

  const removeVisitDay = (id: string) => {
    if (formData.visitDays.length > 1) {
      setFormData({
        ...formData,
        visitDays: formData.visitDays.filter(day => day.id !== id),
      })
    }
  }

  const isFormValid = () => {
    return formData.visitDays.every(day => day.date && day.startTime && day.endTime)
  }

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div className="">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          2. Quand ?
        </h2>
        <p className="text-muted-foreground">
          Planifiez vos journées de visite
        </p>
      </div>

      <div className="space-y-6">
        {formData.visitDays.map((day, index) => (
          <Card key={day.id} className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Jour {index + 1}</h3>
              {formData.visitDays.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeVisitDay(day.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Supprimer
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`date-${day.id}`}>Date</Label>
                <Input
                  id={`date-${day.id}`}
                  type="date"
                  value={day.date}
                  onChange={(e) => updateVisitDay(day.id, 'date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`start-${day.id}`}>Heure de début</Label>
                <Input
                  id={`start-${day.id}`}
                  type="time"
                  value={day.startTime}
                  onChange={(e) => updateVisitDay(day.id, 'startTime', e.target.value)}
                  min="09:00"
                  max="17:00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`end-${day.id}`}>Heure de fin</Label>
                <Input
                  id={`end-${day.id}`}
                  type="time"
                  value={day.endTime}
                  onChange={(e) => updateVisitDay(day.id, 'endTime', e.target.value)}
                  min="09:00"
                  max="18:00"
                />
              </div>
            </div>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addVisitDay}
          className="w-full border-dashed"
        >
          <PlusIcon className="mr-2 size-4" />
          Ajouter une autre journée
        </Button>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ChevronLeftIcon className="mr-2 size-4" />
          Précédent
        </Button>
        <Button
          onClick={onNext}
          disabled={!isFormValid()}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Suivant
          <ChevronRightIcon className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  )
}
