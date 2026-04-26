"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"

const CLOSE_ANIMATION_MS = 200

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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-0 sm:max-w-xl"
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  )
}
