"use client"

import React, { createContext, useContext, useReducer, type ReactNode } from "react"
import { api } from "~/trpc/react"
import { useRouter } from "next/navigation"

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

interface OnboardingData {
  hasChildren: boolean
  walkingLevel: number
  handicaps: Handicaps
  visitDays: VisitDay[]
  preferences: string
}

interface OnboardingState {
  data: OnboardingData | null
  activityIds: string[]
  isLoading: boolean
  error: string | null
}

type OnboardingAction =
  | { type: "SET_DATA"; payload: OnboardingData }
  | { type: "SET_ACTIVITIES"; payload: string[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" }

const initialState: OnboardingState = {
  data: null,
  activityIds: [],
  isLoading: false,
  error: null,
}

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case "SET_DATA":
      return {
        ...state,
        data: action.payload,
        error: null,
      }
    case "SET_ACTIVITIES":
      return {
        ...state,
        activityIds: action.payload,
        isLoading: false,
        error: null,
      }
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
        error: null,
      }
    case "SET_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      }
    case "RESET":
      return initialState
    default:
      return state
  }
}

interface OnboardingContextType {
  state: OnboardingState
  setData: (data: OnboardingData) => void
  processOnboarding: (data: OnboardingData) => Promise<void>
  reset: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState)
  const router = useRouter()
  
  const processOnboardingMutation = api.onboarding.processOnboarding.useMutation({
    onSuccess: (result) => {
      dispatch({ type: "SET_ACTIVITIES", payload: result.activityIds })
      // Rediriger vers la page swipe après succès
      router.push("/swipe")
    },
    onError: (error) => {
      dispatch({ type: "SET_ERROR", payload: error.message })
    },
  })

  const setData = (data: OnboardingData) => {
    dispatch({ type: "SET_DATA", payload: data })
  }

  const processOnboarding = async (data: OnboardingData) => {
    dispatch({ type: "SET_LOADING", payload: true })
    dispatch({ type: "SET_DATA", payload: data })
    
    try {
      await processOnboardingMutation.mutateAsync(data)
    } catch (error) {
      // L'erreur est déjà gérée par onError
      console.error("Erreur lors du traitement de l'onboarding:", error)
    }
  }

  const reset = () => {
    dispatch({ type: "RESET" })
  }

  return (
    <OnboardingContext.Provider
      value={{
        state,
        setData,
        processOnboarding,
        reset,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}
