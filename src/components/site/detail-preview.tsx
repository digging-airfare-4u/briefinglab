import { ArrowUpRight, ExternalLink, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  formatDateGroup,
  formatTime,
  type ContentDetailItem,
} from "@/modules/content/public-content.view-model"

const PREVIEW_BULLET_LIMIT = 5

export function DetailPreview({ item }: { item: ContentDetailItem }) {
  const isPodcast = item.kind === "podcast_episode"
  const hasSummary = item.hasSummary
  const hasOriginalTitle =
    Boolean(item.originalTitle) && item.originalTitle !== item.title
  const contentUrl = item.contentUrl ?? item.sourceUrl
  const bullets = hasSummary ? item.bullets.slice(0, PREVIEW_BULLET_LIMIT) : []
  const bodyText = hasSummary ? item.summary : item.excerpt
  const headingLabel = isPodcast
    ? hasSummary
      ? "播客摘要"
      : "播客摘录"
    : hasSummary
      ? "深度摘要"
      : "原文摘录"

  return (
    <div className="flex flex-col gap-6 px-6 pt-8 pb-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-full bg-primary/8 text-primary hover:bg-primary/8">
            <Sparkles className="size-3.5" />
            {headingLabel}
          </Badge>
          {isPodcast && item.duration ? (
            <Badge
              variant="outline"
              className="rounded-full border-border/70 bg-background/80 text-muted-foreground"
            >
              节目时长 · {item.duration}
            </Badge>
          ) : null}
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
          {formatDateGroup(item.publishedAt)} · {formatTime(item.publishedAt)}
        </p>
        <h2 className="font-heading text-2xl leading-tight font-semibold tracking-tight md:text-[28px]">
          {item.title}
        </h2>
        {hasOriginalTitle ? (
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Original · {item.originalTitle}
          </p>
        ) : null}
        <p className="text-sm leading-7 text-muted-foreground">{item.excerpt}</p>
      </div>

      <Separator />

      <section className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {hasSummary ? "摘要" : "摘录"}
        </p>
        <p className="text-[15px] leading-8 text-foreground/92">{bodyText}</p>
        {bullets.length > 0 ? (
          <ul className="space-y-2.5 pt-1">
            {bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex gap-3 text-sm leading-7 text-foreground/92"
              >
                <span className="mt-2 size-2 shrink-0 rounded-full bg-primary/70" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <Separator />

      <div className="space-y-1 text-sm">
        <p className="font-medium text-foreground">{item.creatorName}</p>
        <p className="font-mono text-xs text-muted-foreground">
          {item.sourceName} · {item.creatorHandle}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button asChild>
          <a href={contentUrl} target="_blank" rel="noreferrer">
            {isPodcast ? "立即收听" : "查看原文"}
            <ArrowUpRight className="size-4" />
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={`/content/${item.slug}`}>
            在完整页面查看
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>
    </div>
  )
}
