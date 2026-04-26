"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

const CLOSE_ANIMATION_MS = 100

export function DetailModal({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(true)

  function handleOpenChange(next: boolean) {
    if (next) return
    setOpen(false)
    setTimeout(() => router.back(), CLOSE_ANIMATION_MS)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] w-full overflow-y-auto p-0 sm:max-w-2xl">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  )
}
