"use client"

import { useState, useCallback } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AlertState {
  open: boolean
  title: string
  message: string
  type: "alert" | "confirm"
  resolve?: (value?: boolean) => void
}

export function useAlert() {
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    title: "",
    message: "",
    type: "alert",
  })

  const showAlert = useCallback((message: string, title: string = "Alert") => {
    return new Promise<void>((resolve) => {
      setAlertState({
        open: true,
        title,
        message,
        type: "alert",
        resolve: () => resolve(),
      })
    })
  }, [])

  const showConfirm = useCallback(
    (message: string, title: string = "Confirm") => {
      return new Promise<boolean>((resolve) => {
        setAlertState({
          open: true,
          title,
          message,
          type: "confirm",
          resolve: (value?: boolean) => resolve(value ?? false),
        })
      })
    },
    []
  )

  const handleConfirm = () => {
    if (alertState.resolve) {
      if (alertState.type === "confirm") {
        alertState.resolve(true)
      } else {
        alertState.resolve()
      }
    }
    setAlertState((prev) => ({ ...prev, open: false }))
  }

  const handleCancel = () => {
    if (alertState.resolve && alertState.type === "confirm") {
      alertState.resolve(false)
    }
    setAlertState((prev) => ({ ...prev, open: false }))
  }

  const AlertComponent = () => (
    <AlertDialog open={alertState.open} onOpenChange={(open) => {
      if (!open) {
        handleCancel()
      }
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{alertState.title}</AlertDialogTitle>
          <AlertDialogDescription>{alertState.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {alertState.type === "confirm" && (
            <AlertDialogCancel onClick={handleCancel}>
              Cancel
            </AlertDialogCancel>
          )}
          <AlertDialogAction onClick={handleConfirm}>
            {alertState.type === "confirm" ? "Confirm" : "OK"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return { showAlert, showConfirm, AlertComponent }
}

