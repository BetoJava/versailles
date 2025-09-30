"use client"

import { useState } from "react"
import { ModeToggle } from "~/components/ui/mode-toggle"
import { Step1 } from "./components/step1"
import { Step2 } from "./components/step2"
import { Step3 } from "./components/step3"
import { AnimatedStep } from "./components/animated-step"
import { useOnboarding } from "~/contexts/onboarding-context"

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
  // Étape 1
  hasChildren: boolean
  walkingLevel: number
  handicaps: Handicaps

  // Étape 2
  visitDays: VisitDay[]

  // Étape 3
  preferences: string
}


function OnboardingPageContent() {
  const { processOnboarding, state } = useOnboarding()

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0] || ""
  }

  const getCurrentTime = () => {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState<"forward" | "backward">("forward")
  const [formData, setFormData] = useState<FormData>({
    hasChildren: false,
    walkingLevel: 25,
    handicaps: {
      mobilite: false,
      vision: false,
      audition: false,
    },
    visitDays: [{
      id: "1",
      date: getCurrentDate(),
      startTime: getCurrentTime(),
      endTime: "",
    }],
    preferences: "",
  })

  const handleNext = () => {
    setDirection("forward")
    setCurrentStep(prev => Math.min(prev + 1, 3))
  }

  const handleBack = () => {
    setDirection("backward")
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleFinish = async () => {
    console.log("Form completed:", formData)
    // Envoyer les données via le contexte
    await processOnboarding(formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-3 sm:p-4 relative"
      style={{
        backgroundColor: 'var(--color-background)'
      }}>
      {/* SVG en arrière-plan */}
      <img 
        src="/chateau_min.svg" 
        alt="Château de Versailles" 
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 min-h-[50vh] w-full object-cover"
        style={{ width: 'full', minHeight: '50vh' }}
      />
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
        <ModeToggle />
      </div>
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="text-center mb-8">

          {/* Indicateur d'étapes */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === currentStep
                        ? "bg-primary text-primary-foreground"
                        : step < currentStep
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-12 h-0.5 mx-2 ${step < currentStep ? "bg-accent" : "bg-muted"
                        }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 px-2 sm:pt-8 overflow-hidden">
          <AnimatedStep
            step={1}
            currentStep={currentStep}
            direction={direction}
          >
            <Step1
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
            />
          </AnimatedStep>

          <AnimatedStep
            step={2}
            currentStep={currentStep}
            direction={direction}
          >
            <Step2
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          </AnimatedStep>

          <AnimatedStep
            step={3}
            currentStep={currentStep}
            direction={direction}
          >
            <Step3
              formData={formData}
              setFormData={setFormData}
              onBack={handleBack}
              onFinish={handleFinish}
            />
          </AnimatedStep>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return <OnboardingPageContent />
}