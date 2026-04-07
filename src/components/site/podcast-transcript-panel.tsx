"use client"

import * as React from "react"
import { FileText } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  makeTranscriptAnchorId,
  type PodcastTranscriptSegment,
  type TranscriptTabValue,
} from "@/components/site/podcast-transcript-utils"

function parseTranscriptHash(hash: string) {
  const cleanHash = hash.replace(/^#/, "")
  const match = cleanHash.match(
    /^(translation|original)-transcript-\d{1,2}-\d{2}(?:-\d{2})?$/
  )

  if (!match) {
    return null
  }

  return {
    anchorId: cleanHash,
    tab: match[1] as TranscriptTabValue,
  }
}

function TranscriptBody({
  text,
  segments,
  tab,
  highlightedAnchor,
}: {
  text?: string | null
  segments: PodcastTranscriptSegment[]
  tab: TranscriptTabValue
  highlightedAnchor: string | null
}) {
  if (!segments.length) {
    return (
      <div className="whitespace-pre-wrap text-[15px] leading-8 text-foreground/92">
        {text ?? "原文暂不可用。"}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {segments.map((segment) => {
        const anchorId = makeTranscriptAnchorId(segment.start, tab)
        const isHighlighted = highlightedAnchor === anchorId

        return (
          <article
            key={`${anchorId}-${segment.body}`}
            id={anchorId}
            className={cn(
              "rounded-2xl border border-border/50 bg-background/60 px-4 py-4 scroll-mt-28 transition-colors",
              isHighlighted && "border-primary/50 bg-primary/8"
            )}
          >
            <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono text-foreground">{segment.start}</span>
              {segment.end ? <span>→ {segment.end}</span> : null}
              {segment.speaker ? <span>{segment.speaker}</span> : null}
            </div>
            <p className="whitespace-pre-wrap text-[15px] leading-8 text-foreground/92">
              {segment.body}
            </p>
          </article>
        )
      })}
    </div>
  )
}

export function PodcastTranscriptPanel({
  hasTranslation,
  hasOriginalTitle,
  title,
  originalTitle,
  translatedTitle,
  originalText,
  translatedText,
  originalSegments,
  translatedSegments,
}: {
  hasTranslation: boolean
  hasOriginalTitle: boolean
  title: string
  originalTitle?: string
  translatedTitle?: string
  originalText?: string | null
  translatedText?: string | null
  originalSegments: PodcastTranscriptSegment[]
  translatedSegments: PodcastTranscriptSegment[]
}) {
  const defaultTab: TranscriptTabValue = hasTranslation ? "translation" : "original"
  const [activeTab, setActiveTab] = React.useState<TranscriptTabValue>(defaultTab)
  const [highlightedAnchor, setHighlightedAnchor] = React.useState<string | null>(
    null
  )

  React.useEffect(() => {
    const syncFromHash = () => {
      if (typeof window === "undefined") {
        return
      }

      const parsed = parseTranscriptHash(window.location.hash)

      if (!parsed) {
        return
      }

      setActiveTab(parsed.tab)
      setHighlightedAnchor(parsed.anchorId)

      window.requestAnimationFrame(() => {
        document.getElementById(parsed.anchorId)?.scrollIntoView({
          block: "start",
        })
      })
    }

    syncFromHash()
    window.addEventListener("hashchange", syncFromHash)

    return () => {
      window.removeEventListener("hashchange", syncFromHash)
    }
  }, [])

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        setActiveTab(value as TranscriptTabValue)
        setHighlightedAnchor(null)
      }}
      className="gap-4"
    >
      <TabsList
        variant="line"
        className="h-auto gap-2 rounded-2xl border border-border/70 bg-background/80 p-1"
      >
        {hasTranslation ? (
          <TabsTrigger
            value="translation"
            className="rounded-xl px-3 py-2 text-sm data-active:bg-primary/8 data-active:text-primary"
          >
            中文逐字稿
          </TabsTrigger>
        ) : null}
        <TabsTrigger
          value="original"
          className="rounded-xl px-3 py-2 text-sm data-active:bg-primary/8 data-active:text-primary"
        >
          英文原文
        </TabsTrigger>
      </TabsList>

      {hasTranslation ? (
        <TabsContent value="translation" className="space-y-4">
          {translatedTitle && translatedTitle !== title ? (
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                节目译名
              </p>
              <p className="mt-2 text-base font-medium leading-7 text-foreground">
                {translatedTitle}
              </p>
            </div>
          ) : null}
          <div className="rounded-3xl border border-border/60 bg-background/70 p-5">
            <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <FileText className="size-3.5" />
              中文逐字稿
            </p>
            <TranscriptBody
              text={translatedText}
              segments={translatedSegments}
              tab="translation"
              highlightedAnchor={highlightedAnchor}
            />
          </div>
        </TabsContent>
      ) : null}

      <TabsContent value="original" className="space-y-4">
        {originalTitle && hasOriginalTitle ? (
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Original title
            </p>
            <p className="mt-2 text-base font-medium leading-7 text-foreground">
              {originalTitle}
            </p>
          </div>
        ) : null}
        <div className="rounded-3xl border border-border/60 bg-background/70 p-5">
          <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <FileText className="size-3.5" />
            英文原文
          </p>
          <TranscriptBody
            text={originalText ?? "原文暂不可用。"}
            segments={originalSegments}
            tab="original"
            highlightedAnchor={highlightedAnchor}
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}
