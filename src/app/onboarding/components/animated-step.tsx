"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ReactNode } from "react"

interface AnimatedStepProps {
  children: ReactNode
  step: number
  currentStep: number
  direction: "forward" | "backward"
}

export function AnimatedStep({ children, step, currentStep, direction }: AnimatedStepProps) {
  const isActive = step === currentStep

  const slideVariants = {
    enter: (direction: "forward" | "backward") => ({
      x: direction === "forward" ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: "forward" | "backward") => ({
      x: direction === "forward" ? -300 : 300,
      opacity: 0,
    }),
  }

  const transition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.4,
  }

  if (!isActive) return null

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={step}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={transition}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
