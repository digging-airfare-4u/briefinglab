import type { ComponentType } from "react"
import Link from "next/link"
import { ArrowRight, FileText, Newspaper, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  formatTime,
  type ContentCategory,
  type ContentListItem,
} from "@/modules/content/public-content.view-model"

const categoryMeta: Record<
  ContentCategory,
  { label: string; icon: ComponentType<{ className?: string }> }
> = {
  article: { label: "文章", icon: FileText },
  news: { label: "动态", icon: Newspaper },
}

export function StandardContentCard({ item }: { item: ContentListItem }) {
  const meta = categoryMeta[item.category]
  const Icon = meta.icon

  return (
    <Card className="gap-4 border-border/60 bg-card/92 shadow-none transition-colors hover:border-primary/25">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge className="rounded-full bg-primary/8 text-primary hover:bg-primary/8">
            <Icon className="size-3.5" />
            {meta.label}
          </Badge>
          <span className="font-mono">{formatTime(item.publishedAt)}</span>
          <span>·</span>
          <span>{item.sourceName}</span>
        </div>
        <CardTitle className="text-[1.02rem] leading-7 transition-colors group-hover/card:text-primary">
          <Link href={`/content/${item.slug}`}>{item.title}</Link>
        </CardTitle>
        <CardDescription className="text-sm leading-7">
          {item.excerpt}
        </CardDescription>
      </CardHeader>
      <CardFooter className="items-center justify-between gap-4 border-t border-border/60 bg-transparent">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {item.creatorName}
          </p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {item.creatorHandle}
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link href={`/content/${item.slug}`}>
            阅读
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export function DigestContentCard({ item }: { item: ContentListItem }) {
  return (
    <Card className="gap-4 border-primary/18 bg-primary/4 shadow-none transition-colors hover:border-primary/28">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge className="rounded-full bg-primary text-primary-foreground hover:bg-primary">
            <Sparkles className="size-3.5" />
            摘要
          </Badge>
          <span className="font-mono">{item.readTime}</span>
        </div>
        <CardTitle className="text-xl leading-8">
          <Link href={`/content/${item.slug}`}>{item.title}</Link>
        </CardTitle>
        <CardDescription className="text-sm leading-7">{item.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2.5">
          {item.bullets.slice(0, 2).map((bullet) => (
            <li key={bullet} className="flex gap-3 text-sm leading-7 text-foreground/92">
              <span className="mt-2 size-2 shrink-0 rounded-full bg-primary/70" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="items-center justify-between gap-4 border-t border-primary/12 bg-transparent">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{item.sourceName}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {formatTime(item.publishedAt)} · {item.creatorHandle}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={`/content/${item.slug}`}>
            查看摘要
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
