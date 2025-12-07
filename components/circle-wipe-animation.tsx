"use client"

import { motion } from "motion/react"
import { useEffect, useState } from "react"

interface CircleWipeAnimationProps {
  onComplete: () => void
  duration?: number
}

export function CircleWipeAnimation({ onComplete, duration = 1000 }: CircleWipeAnimationProps) {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 })

  useEffect(() => {
    // Get screen dimensions
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    const timer = setTimeout(() => {
      onComplete()
    }, duration)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", updateDimensions)
    }
  }, [duration, onComplete])

  // Calculate the radius needed to cover the entire screen (diagonal)
  const maxRadius = Math.sqrt(
    Math.pow(dimensions.width, 2) + Math.pow(dimensions.height, 2)
  )

  return (
    <motion.div
      className="fixed inset-0 z-[200] pointer-events-none overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Circle mask that expands from center to reveal dashboard */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundColor: "var(--background)",
          clipPath: `circle(0px at 50% 50%)`,
        }}
        animate={{
          clipPath: `circle(${maxRadius}px at 50% 50%)`,
        }}
        transition={{
          duration: duration / 1000,
          ease: [0.4, 0, 0.2, 1],
        }}
      />
    </motion.div>
  )
}

