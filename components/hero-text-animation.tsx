"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface HeroTextAnimationProps {
  children: React.ReactNode
  delay?: number
  className?: string
  variant?: "fade-up" | "fade-in" | "typewriter" | "slide-up"
}

export function HeroTextAnimation({
  children,
  delay = 0,
  className,
  variant = "fade-up",
}: HeroTextAnimationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const getClasses = () => {
    if (variant === "fade-up") {
      return !isVisible ? "opacity-0 translate-y-8" : "opacity-100 translate-y-0"
    }
    if (variant === "fade-in") {
      return !isVisible ? "opacity-0" : "opacity-100"
    }
    if (variant === "slide-up") {
      return !isVisible ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
    }
    return ""
  }

  return (
    <div
      className={cn(
        "transition-all duration-1000 ease-out",
        getClasses(),
        className
      )}
    >
      {children}
    </div>
  )
}

interface TypewriterTextProps {
  text: string
  speed?: number
  delay?: number
  className?: string
  showCursor?: boolean
}

export function TypewriterText({
  text,
  speed = 50,
  delay = 0,
  className,
  showCursor = true,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let currentIndex = 0

    const startTyping = () => {
      const typeNextChar = () => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1))
          currentIndex++
          timeoutId = setTimeout(typeNextChar, speed)
        } else {
          setIsComplete(true)
        }
      }

      typeNextChar()
    }

    const timer = setTimeout(startTyping, delay)

    return () => {
      clearTimeout(timer)
      clearTimeout(timeoutId)
    }
  }, [text, speed, delay])

  return (
    <span className={className}>
      {displayedText}
      {showCursor && !isComplete && (
        <span className="animate-pulse inline-block ml-1">|</span>
      )}
    </span>
  )
}

interface GradientTextProps {
  children: React.ReactNode
  className?: string
  animated?: boolean
}

export function GradientText({
  children,
  className,
  animated = true,
}: GradientTextProps) {
  return (
    <span
      className={cn(
        animated ? "gradient-text-animated" : "gradient-text",
        className
      )}
    >
      {children}
    </span>
  )
}

