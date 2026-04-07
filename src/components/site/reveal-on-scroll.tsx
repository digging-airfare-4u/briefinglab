"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export function RevealOnScroll({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(entry.target)
          }
        }
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.12,
      }
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "scroll-reveal motion-reduce:translate-y-0 motion-reduce:opacity-100",
        isVisible && "is-visible",
        className
      )}
    >
      {children}
    </div>
  )
}
