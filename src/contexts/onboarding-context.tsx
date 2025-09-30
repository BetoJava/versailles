"use client"

import React, { createContext, useContext, useReducer, type ReactNode } from "react"
import { api } from "~/trpc/react"
import { useRouter } from "next/navigation"

export interface VisitDay {
  id: string
  date: string
  startTime: string
  endTime: string
}

export interface Handicaps {
  mobilite: boolean
  vision: boolean
  audition: boolean
}

export interface OnboardingData {
  hasChildren: boolean
  walkingLevel: number
  handicaps: Handicaps
  visitDays: VisitDay[]
  preferences: string
}

interface OnboardingState {
  data: OnboardingData | null
  activityIds: string[]
  swipedActivities: string[]
  removedActivityIds: string[]
  swipeActivities: SwipeActivity[]
  itinerary: Itinerary | null
  isLoading: boolean
  error: string | null
}

export interface SwipeActivity {
  activityId: string
  name: string
  catchy_description: string
  reason: string
}

export interface SwipeResult {
  activityId: string
  like: boolean
}

export interface Itinerary {
  departure_time: string
  arrival_time: string
  total_duration: number
  total_activities: number
  itinerary: ItineraryStep[]
  stats: {
    total_travel_time: number
    total_visit_time: number
    total_waiting_time: number
  }
  description: string
}

export interface ItineraryStep {
  order: number
  activity_id?: string
  activity_name: string
  arrival_time: string
  departure_time: string
  duration: number
  waiting_time: number
  travel_time_from_previous: number
  composite_score?: number
  recommendation_score?: number
}

type OnboardingAction =
  | { type: "SET_DATA"; payload: OnboardingData }
  | { type: "SET_ACTIVITIES"; payload: { activityIds: string[]; removedActivityIds: string[]; swipeActivities: SwipeActivity[] } }
  | { type: "SET_SWIPED_ACTIVITIES"; payload: string[] }
  | { type: "SET_SWIPE_RESULTS"; payload: SwipeResult[] }
  | { type: "SET_ITINERARY"; payload: Itinerary }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" }

const initialState: OnboardingState = {
  data: null,
  activityIds: [],
  swipedActivities: [],
  removedActivityIds: [],
  swipeActivities: [],
  itinerary: null,
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
        activityIds: action.payload.activityIds,
        removedActivityIds: action.payload.removedActivityIds,
        swipeActivities: action.payload.swipeActivities,
        isLoading: false,
        error: null,
      }
    case "SET_SWIPED_ACTIVITIES":
      return {
        ...state,
        swipedActivities: action.payload,
      }
    case "SET_SWIPE_RESULTS":
      return {
        ...state,
        swipedActivities: action.payload.filter(r => r.like).map(r => r.activityId),
      }
    case "SET_ITINERARY":
      return {
        ...state,
        itinerary: action.payload,
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
  setSwipedActivities: (activityIds: string[]) => void
  setSwipeResults: (results: SwipeResult[]) => void
  setItinerary: (itinerary: Itinerary) => void
  processOnboarding: (data: OnboardingData) => Promise<void>
  reset: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialState)
  const router = useRouter()
  
  const processOnboardingMutation = api.onboarding.processOnboarding.useMutation({
    onSuccess: (result) => {
      console.log("Résultat reçu du serveur:", result)
      console.log("swipeActivities reçues:", result.swipeActivities)
      console.log("Nombre d'activités swipe:", result.swipeActivities?.length)
      
      dispatch({ 
        type: "SET_ACTIVITIES", 
        payload: {
          activityIds: result.activityIds,
          removedActivityIds: result.removedActivityIds,
          swipeActivities: result.swipeActivities,
        }
      })
      // Rediriger vers la page swipe après succès
      router.push("/swipe")
    },
    onError: (error) => {
      console.error("Erreur lors du traitement:", error)
      dispatch({ type: "SET_ERROR", payload: error.message })
    },
  })

  const setData = (data: OnboardingData) => {
    dispatch({ type: "SET_DATA", payload: data })
  }

  const setSwipedActivities = (activityIds: string[]) => {
    dispatch({ type: "SET_SWIPED_ACTIVITIES", payload: activityIds })
  }

  const setSwipeResults = (results: SwipeResult[]) => {
    dispatch({ type: "SET_SWIPE_RESULTS", payload: results })
  }

  const setItinerary = (itinerary: Itinerary) => {
    dispatch({ type: "SET_ITINERARY", payload: itinerary })
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
        setSwipedActivities,
        setSwipeResults,
        setItinerary,
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
