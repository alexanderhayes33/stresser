"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckmarkAnimationProps {
  className?: string
}

export function CheckmarkAnimation({ className }: CheckmarkAnimationProps) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setAnimate(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div
        className={cn(
          "relative rounded-full border-2 transition-all duration-500",
          animate
            ? "h-20 w-20 border-foreground"
            : "h-0 w-0 border-transparent"
        )}
      >
        <Check
          className={cn(
            "absolute inset-0 m-auto transition-all duration-300",
            animate
              ? "h-12 w-12 text-foreground opacity-100"
              : "h-0 w-0 opacity-0"
          )}
          style={{
            transitionDelay: animate ? "300ms" : "0ms",
          }}
        />
      </div>
    </div>
  )
}

