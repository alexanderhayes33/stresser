"use client"

import * as React from "react"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { Button } from "@/components/ui/button"
import { Moon } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    // Sync with next-themes when theme changes
    if (mounted && theme) {
      const isDark = theme === "dark"
      const currentIsDark = document.documentElement.classList.contains("dark")
      if (currentIsDark !== isDark) {
        document.documentElement.classList.toggle("dark", isDark)
      }
    }
  }, [theme, mounted])

  React.useEffect(() => {
    // Listen for theme changes from AnimatedThemeToggler
    const handleThemeChange = (e: CustomEvent) => {
      const newTheme = e.detail as string
      setTheme(newTheme)
    }

    window.addEventListener("theme-change", handleThemeChange as EventListener)
    return () => {
      window.removeEventListener("theme-change", handleThemeChange as EventListener)
    }
  }, [setTheme])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Moon className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <AnimatedThemeToggler
      className="h-9 w-9 hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    />
  )
}

