"use client"

import * as React from "react"
import { Sparkles, ChevronDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"

export type DailySummary = {
  summary: string
  bullets: string[]
  highlights: string[]
}

export function DailySummaryCard({ summary }: { summary: DailySummary }) {
  const [open, setOpen] = React.useState(false)
  const hasHighlights = summary.highlights.length > 0
  const hasBullets = summary.bullets.length > 0
  const shouldTruncate =
    summary.summary.length > 100 || summary.bullets.length > 2 || summary.highlights.length > 2

  return (
    <Card className="relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-accent/[0.04] shadow-none">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/60 to-primary/10" />

      <CardHeader className="flex-row items-center gap-2 pb-2 pt-4 pl-5">
        <Badge
          variant="secondary"
          className="h-6 gap-1 rounded-full bg-primary/10 px-2.5 text-xs font-medium text-primary hover:bg-primary/10"
        >
          <Sparkles className="size-3.5" />
          AI 日报
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3 pb-4 pl-5 pr-4">
        <p
          className={`text-sm leading-7 text-foreground/90 ${
            !open && shouldTruncate ? "line-clamp-2" : ""
          }`}
        >
          {summary.summary}
        </p>

        {hasBullets ? (
          <ul className="space-y-1.5">
            {summary.bullets.slice(0, open ? undefined : 2).map((bullet, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm leading-6 text-muted-foreground"
              >
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {hasHighlights ? (
          <ul className="space-y-1.5">
            {summary.highlights.slice(0, open ? undefined : 2).map((highlight, i) => (
              <li
                key={`h-${i}`}
                className="flex gap-2 text-sm leading-6 text-foreground/80"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-sm bg-accent/70" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {shouldTruncate ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen((v) => !v)}
            className="h-7 gap-1 px-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {open ? "收起" : "展开全文"}
            <ChevronDown
              className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
