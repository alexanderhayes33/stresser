"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"

export function PageLoadProgress() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Reset progress เมื่อเปลี่ยนหน้า
    setProgress(0)
    setIsLoading(true)

    // เริ่มต้นที่ 20% ทันที
    setProgress(0.2)

    // ตรวจสอบสถานะการโหลดปัจจุบัน
    const checkReadyState = () => {
      const readyState = document.readyState
      
      if (readyState === "complete") {
        // หน้าโหลดเสร็จแล้ว - complete ทันที
        setProgress(1)
        setTimeout(() => {
          setIsLoading(false)
          setProgress(0)
        }, 50)
        return true
      } else if (readyState === "interactive") {
        // DOM พร้อมแล้ว - เกือบเสร็จ
        setProgress(0.9)
        // รอ load event
        const handleLoad = () => {
          setProgress(1)
          setTimeout(() => {
            setIsLoading(false)
            setProgress(0)
          }, 50)
        }
        // ตรวจสอบอีกครั้งว่าอาจจะ complete แล้ว
        if (document.readyState === "complete") {
          handleLoad()
        } else {
          window.addEventListener("load", handleLoad, { once: true })
          return () => window.removeEventListener("load", handleLoad)
        }
      }
      return false
    }

    // ตรวจสอบทันที
    if (!checkReadyState()) {
      // ถ้ายังไม่เสร็จ ฟัง events
      const handleDOMContentLoaded = () => {
        setProgress(0.8)
      }

      const handleLoad = () => {
        setProgress(1)
        setTimeout(() => {
          setIsLoading(false)
          setProgress(0)
        }, 50)
      }

      // สำหรับ client-side navigation (Next.js) - หน้าโหลดเร็วมาก
      // ใช้ timeout สั้นๆ เพื่อให้เห็น progress แม้หน้าโหลดเร็ว
      const quickTimer = setTimeout(() => {
        if (document.readyState === "complete") {
          setProgress(1)
          setTimeout(() => {
            setIsLoading(false)
            setProgress(0)
          }, 50)
        } else if (document.readyState === "interactive") {
          setProgress(0.95)
        }
      }, 10)

      document.addEventListener("DOMContentLoaded", handleDOMContentLoaded, { once: true })
      window.addEventListener("load", handleLoad, { once: true })

      return () => {
        clearTimeout(quickTimer)
        document.removeEventListener("DOMContentLoaded", handleDOMContentLoaded)
        window.removeEventListener("load", handleLoad)
      }
    }
  }, [pathname])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className={cn(
            "fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-foreground/80 via-foreground/60 to-foreground/40"
          )}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: progress, opacity: isLoading ? 1 : 0 }}
          exit={{ scaleX: 1, opacity: 0 }}
          transition={{ duration: 0.05, ease: "easeOut" }}
        />
      )}
    </AnimatePresence>
  )
}

