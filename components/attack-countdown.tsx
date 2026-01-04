"use client"

import { useState, useEffect, useRef } from "react"
import { Clock } from "lucide-react"

interface AttackCountdownProps {
  startedAt: string | null
  duration: number
  status: string
}

export function AttackCountdown({ startedAt, duration, status }: AttackCountdownProps) {
  const [remaining, setRemaining] = useState<number | null>(null)
  const [timeOffset, setTimeOffset] = useState<number>(0)
  const offsetFetched = useRef(false)

  // Fetch server time offset on mount
  useEffect(() => {
    if (offsetFetched.current) return
    
    const fetchTimeOffset = async () => {
      try {
        const clientTimeBefore = Date.now()
        const response = await fetch('/api/time')
        const clientTimeAfter = Date.now()
        
        if (response.ok) {
          const data = await response.json()
          const serverTime = Date.parse(data.serverTime)
          const networkLatency = (clientTimeAfter - clientTimeBefore) / 2
          const clientTime = clientTimeBefore + networkLatency
          const offset = serverTime - clientTime
          setTimeOffset(offset)
          offsetFetched.current = true
        }
      } catch (error) {
        console.error('Failed to fetch server time:', error)
      }
    }
    
    fetchTimeOffset()
  }, [])

  useEffect(() => {
    if (status !== "running" && status !== "pending") {
      setRemaining(null)
      return
    }

    const updateRemaining = () => {
      if (!startedAt) {
        setRemaining(null)
        return
      }
      
      // Parse ISO string directly to avoid timezone issues
      const startTime = Date.parse(startedAt)
      
      // Check if parsing was successful
      if (isNaN(startTime)) {
        setRemaining(null)
        return
      }
      
      // Use client time with offset to sync with server time
      const now = Date.now() + timeOffset
      const elapsed = Math.floor((now - startTime) / 1000)
      const remaining = duration - elapsed
      setRemaining(remaining > 0 ? remaining : 0)
    }

    // Update immediately
    updateRemaining()
    
    // Then update every second
    const interval = setInterval(updateRemaining, 1000)

    return () => clearInterval(interval)
  }, [startedAt, duration, status, timeOffset])

  if (remaining === null || status !== "running") {
    return null
  }

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const timeString = `${mins}:${secs.toString().padStart(2, '0')}`

  return (
    <div className="flex items-center gap-1 text-sm text-blue-500">
      <Clock className="h-3 w-3" />
      <span>{timeString}</span>
    </div>
  )
}

