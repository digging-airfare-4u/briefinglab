import Link from "next/link"
import { ArrowUpRight, BookOpenText, Radar, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  formatDateGroup,
  type ContentListItem,
} from "@/modules/content/public-content.view-model"

export function EditorialRail({
  items,
  compact = false,
}: {
  items: ContentListItem[]
  compact?: boolean
}) {
  const [lead, ...rest] = items

  return (
    <div className="space-y-4">
      <Card className="glass-card gap-4 border-border/65 shadow-sm shadow-primary/5">
        <CardHeader className="space-y-3">
          <Badge className="w-fit rounded-full bg-primary/8 text-primary hover:bg-primary/8">
            <Sparkles className="size-3.5" />
            今日精选
          </Badge>
          <div>
            <CardTitle className="text-lg">{lead.title}</CardTitle>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {lead.summary}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-background/80 px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              {formatDateGroup(lead.publishedAt)}
            </p>
            <ul className="mt-3 space-y-3">
              {lead.bullets.slice(0, 2).map((bullet) => (
                <li key={bullet} className="flex gap-3 text-sm leading-7 text-foreground/92">
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-primary/70" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button asChild className="w-full">
            <Link href={`/content/${lead.slug}`}>先读这一篇</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card gap-4 border-border/65 shadow-sm shadow-primary/5">
        <CardHeader className="space-y-3">
          <Badge
            variant="outline"
            className="w-fit rounded-full border-border/80 bg-background/70 text-muted-foreground"
          >
            <Radar className="size-3.5" />
            本周信号
          </Badge>
          <CardTitle className="text-lg">值得继续追踪的 3 条线索</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rest.slice(0, compact ? 2 : 3).map((item, index) => (
            <div key={item.slug}>
              <Link
                href={`/content/${item.slug}`}
                className="group block rounded-2xl transition-colors"
              >
                <p className="text-sm font-medium leading-6 text-foreground group-hover:text-primary">
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {item.excerpt}
                </p>
              </Link>
              {index < rest.slice(0, compact ? 2 : 3).length - 1 ? (
                <Separator className="mt-4" />
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card gap-4 border-border/65 shadow-sm shadow-primary/5">
        <CardHeader className="space-y-3">
          <Badge
            variant="outline"
            className="w-fit rounded-full border-border/80 bg-background/70 text-muted-foreground"
          >
            <BookOpenText className="size-3.5" />
            阅读协议
          </Badge>
          <CardTitle className="text-lg">为什么首页先给摘要，不先给原文</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
          <p>先用摘要建立上下文，再决定是否跳转原文，可以显著降低信息负担。</p>
          <p>站内的价值不在搬运链接，而在于把一天里真正值得读的内容组织得更清晰。</p>
          <Button asChild variant="outline" className="mt-2 w-full">
            <Link href="/about">
              了解方法说明
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
