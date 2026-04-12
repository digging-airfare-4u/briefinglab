import Link from "next/link"
import {
  ArrowLeft,
  ArrowUpRight,
  FileText,
  Languages,
  Quote,
  Radar,
  Sparkles,
} from "lucide-react"

import { PodcastTranscriptPanel } from "@/components/site/podcast-transcript-panel"
import {
  makeTranscriptAnchorId,
  parsePodcastTranscript,
} from "@/components/site/podcast-transcript-utils"
import { SiteHeader } from "@/components/site/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  formatDateGroup,
  formatTime,
  type ContentDetailItem,
  type ContentListItem,
} from "@/modules/content/public-content.view-model"

export function DetailPage({
  item,
}: {
  item: ContentDetailItem
  relatedItems?: ContentListItem[]
}) {
  const hasEnglishSummary = Boolean(item.englishSummary)
  const hasTranslation = Boolean(item.translatedText)
  const hasSummary = item.hasSummary
  const hasOriginalTitle =
    Boolean(item.originalTitle) && item.originalTitle !== item.title
  const isPodcast = item.kind === "podcast_episode"
  const hasTimeline = Boolean(item.timeline?.length)
  const contentUrl = item.contentUrl ?? item.sourceUrl
  const translatedTranscriptSegments = isPodcast
    ? parsePodcastTranscript(item.translatedText)
    : []
  const originalTranscriptSegments = isPodcast
    ? parsePodcastTranscript(item.originalText)
    : []
  const timelineTargetTab =
    hasTranslation && translatedTranscriptSegments.length > 0
      ? "translation"
      : "original"
  const isCompactContent = item.detailMode === "compact"
  const showDeepAnalysis = item.detailMode === "deep"

  return (
    <div className="min-h-screen">
      <SiteHeader activeNav="deep" />
      <main className="app-shell pb-20 pt-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <Card className="glass-card gap-5 border-border/65 shadow-md shadow-primary/8">
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild variant="ghost" size="sm" className="-ml-2">
                    <Link href="/">
                      <ArrowLeft className="size-4" />
                      返回首页
                    </Link>
                  </Button>
                  <Badge className="rounded-full bg-primary/8 text-primary hover:bg-primary/8">
                    <Sparkles className="size-3.5" />
                    {isPodcast
                      ? hasSummary
                        ? "播客摘要"
                        : "播客摘录"
                      : isCompactContent
                        ? "双语速览"
                        : hasSummary
                          ? "深度摘要"
                          : "原文摘录"}
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
                <div className="space-y-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    {formatDateGroup(item.publishedAt)} · {formatTime(item.publishedAt)}
                  </p>
                  <CardTitle className="font-heading text-3xl leading-tight font-semibold tracking-tight md:text-4xl">
                    {item.title}
                  </CardTitle>
                  {hasOriginalTitle ? (
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Original title · {item.originalTitle}
                    </p>
                  ) : null}
                  <p className="max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                    {item.excerpt}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.badges?.map((badge) => (
                    <Badge
                      key={badge}
                      variant="outline"
                      className="rounded-full border-border/70 bg-background/80 text-muted-foreground"
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>
                {isPodcast ? (
                  <div className="flex flex-wrap gap-3">
                    <Button asChild>
                      <a href={contentUrl} target="_blank" rel="noreferrer">
                        立即收听
                        <ArrowUpRight className="size-4" />
                      </a>
                    </Button>
                    {hasTimeline ? (
                      <Button asChild variant="outline">
                        <a href="#timeline">查看时间线</a>
                      </Button>
                    ) : null}
                    <Button asChild variant="ghost">
                      <a href="#transcript">打开逐字稿</a>
                    </Button>
                  </div>
                ) : null}
              </CardHeader>
            </Card>

            {showDeepAnalysis &&
            (isPodcast ? (
              <Card className="glass-card gap-5 border-primary/18 bg-linear-to-br from-primary/7 to-card shadow-sm shadow-primary/8">
                <CardHeader className="space-y-3">
                    <Badge className="w-fit rounded-full bg-primary text-primary-foreground hover:bg-primary">
                      {hasSummary ? "TL;DR" : "摘录"}
                    </Badge>
                  <CardTitle className="text-2xl">
                    {hasSummary ? "这期讲了什么" : "当前先看原文摘录"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-[15px] leading-8 text-foreground/92">
                  <p>{hasSummary ? item.summary : item.excerpt}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                <Card className="glass-card gap-5 border-primary/18 bg-linear-to-br from-primary/7 to-card shadow-sm shadow-primary/8">
                  <CardHeader className="space-y-3">
                    <Badge className="w-fit rounded-full bg-primary text-primary-foreground hover:bg-primary">
                      {hasSummary ? "中文摘要" : "原文摘录"}
                    </Badge>
                    <CardTitle className="text-2xl">
                      {hasSummary ? "摘要" : "摘要暂未生成"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-[15px] leading-8 text-foreground/92">
                    <p>{hasSummary ? item.summary : item.excerpt}</p>
                  </CardContent>
                </Card>

                {hasSummary && hasEnglishSummary ? (
                  <Card className="glass-card gap-5 border-border/65 bg-linear-to-br from-background to-card shadow-sm shadow-primary/5">
                    <CardHeader className="space-y-3">
                      <Badge
                        variant="outline"
                        className="w-fit rounded-full border-border/70 bg-background/80 text-muted-foreground"
                      >
                        English Summary
                      </Badge>
                      <CardTitle className="text-2xl">Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-[15px] leading-8 text-foreground/92">
                      <p>{item.englishSummary}</p>
                      {item.englishBullets?.length ? (
                        <ul className="space-y-2 text-sm leading-7 text-muted-foreground">
                          {item.englishBullets.slice(0, 3).map((bullet) => (
                            <li key={bullet} className="flex gap-3">
                              <span className="mt-2 size-2 shrink-0 rounded-full bg-foreground/35" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            ))}

            {showDeepAnalysis && hasSummary && item.bullets.length > 0 ? (
              <Card className="glass-card gap-4 border-border/65 shadow-sm shadow-primary/5">
                <CardHeader className="space-y-3">
                  <Badge
                    variant="outline"
                    className="w-fit rounded-full border-border/70 bg-background/80 text-muted-foreground"
                  >
                    <Radar className="size-3.5" />
                    {isPodcast ? "本期你会听到" : "关键要点"}
                  </Badge>
                  <CardTitle>
                    {isPodcast ? "本期你会听到" : `${item.bullets.length} 个要点`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {item.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex gap-3 text-sm leading-7 text-foreground/92"
                      >
                        <span className="mt-2 size-2 shrink-0 rounded-full bg-primary/75" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {isPodcast && hasTimeline ? (
              <Card
                id="timeline"
                className="glass-card gap-4 border-border/65 shadow-sm shadow-primary/5"
              >
                <CardHeader className="space-y-3">
                  <Badge
                    variant="outline"
                    className="w-fit rounded-full border-border/70 bg-background/80 text-muted-foreground"
                  >
                    <Radar className="size-3.5" />
                    对话时间线
                  </Badge>
                  <CardTitle>对话时间线</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {item.timeline?.map((segment) => (
                      <li key={`${segment.start}-${segment.title}`}>
                        <a
                          href={`#${makeTranscriptAnchorId(segment.start, timelineTargetTab)}`}
                          className="grid gap-1 rounded-2xl border border-border/50 bg-background/60 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                        >
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-mono text-foreground">
                              {segment.start}
                            </span>
                            {segment.end ? <span>→ {segment.end}</span> : null}
                            {segment.speaker ? <span>{segment.speaker}</span> : null}
                          </div>
                          <p className="text-sm leading-7 text-foreground/92">
                            {segment.title}
                          </p>
                        </a>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ) : null}

            {showDeepAnalysis && item.editorialTake ? (
              <Card className="glass-card gap-4 border-border/65 shadow-sm shadow-primary/5">
                <CardHeader className="space-y-3">
                  <Badge
                    variant="outline"
                    className="w-fit rounded-full border-border/70 bg-background/80 text-muted-foreground"
                  >
                    <Quote className="size-3.5" />
                    {isPodcast ? "为什么值得听" : "编辑观点"}
                  </Badge>
                  <CardTitle>
                    {isPodcast ? "为什么值得听" : "这件事真正重要的地方"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-foreground/92">
                  {item.editorialTake}
                </CardContent>
              </Card>
            ) : null}

            <Card
              id="transcript"
              className="glass-card gap-4 border-border/65 shadow-sm shadow-primary/5"
            >
              <CardHeader className="space-y-3">
                <Badge
                  variant="outline"
                  className="w-fit rounded-full border-border/70 bg-background/80 text-muted-foreground"
                >
                  <Languages className="size-3.5" />
                  {isPodcast ? "对话逐字稿" : "原文与译文"}
                </Badge>
                <CardTitle>{isPodcast ? "对话逐字稿" : "正文"}</CardTitle>
              </CardHeader>
              <CardContent>
                {isPodcast ? (
                  <PodcastTranscriptPanel
                    hasTranslation={hasTranslation}
                    hasOriginalTitle={hasOriginalTitle}
                    title={item.title}
                    originalTitle={item.originalTitle}
                    translatedTitle={item.translatedTitle}
                    originalText={item.originalText}
                    translatedText={item.translatedText}
                    originalSegments={originalTranscriptSegments}
                    translatedSegments={translatedTranscriptSegments}
                  />
                ) : isCompactContent ? (
                  <div className="space-y-4">
                    {hasTranslation ? (
                      <div className="rounded-3xl border border-border/60 bg-background/70 p-5">
                        <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          <FileText className="size-3.5" />
                          简体中文译文
                        </p>
                        <div className="whitespace-pre-wrap text-[15px] leading-8 text-foreground/92">
                          {item.translatedText}
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-3xl border border-border/60 bg-background/70 p-5">
                      <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        <FileText className="size-3.5" />
                        英文原文
                      </p>
                      <div className="whitespace-pre-wrap text-[15px] leading-8 text-foreground/92">
                        {item.originalText ?? "原文暂不可用。"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Tabs
                    defaultValue={hasTranslation ? "translation" : "original"}
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
                          译文
                        </TabsTrigger>
                      ) : null}
                      <TabsTrigger
                        value="original"
                        className="rounded-xl px-3 py-2 text-sm data-active:bg-primary/8 data-active:text-primary"
                      >
                        原文
                      </TabsTrigger>
                    </TabsList>

                    {hasTranslation ? (
                      <TabsContent value="translation" className="space-y-4">
                        {item.translatedTitle && item.translatedTitle !== item.title ? (
                          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                              译文标题
                            </p>
                            <p className="mt-2 text-base font-medium leading-7 text-foreground">
                              {item.translatedTitle}
                            </p>
                          </div>
                        ) : null}
                        <div className="rounded-3xl border border-border/60 bg-background/70 p-5">
                          <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            <FileText className="size-3.5" />
                            简体中文译文
                          </p>
                          <div className="whitespace-pre-wrap text-[15px] leading-8 text-foreground/92">
                            {item.translatedText}
                          </div>
                        </div>
                      </TabsContent>
                    ) : null}

                    <TabsContent value="original" className="space-y-4">
                      {item.originalTitle && hasOriginalTitle ? (
                        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            Original title
                          </p>
                          <p className="mt-2 text-base font-medium leading-7 text-foreground">
                            {item.originalTitle}
                          </p>
                        </div>
                      ) : null}
                      <div className="rounded-3xl border border-border/60 bg-background/70 p-5">
                        <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          <FileText className="size-3.5" />
                          原文正文
                        </p>
                        <div className="whitespace-pre-wrap text-[15px] leading-8 text-foreground/92">
                          {item.originalText ?? "原文暂不可用。"}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="glass-card gap-4 border-border/65 shadow-sm shadow-primary/5 lg:sticky lg:top-24">
              <CardHeader className="space-y-3">
                <Badge
                  variant="outline"
                  className="w-fit rounded-full border-border/70 bg-background/80 text-muted-foreground"
                >
                  {isPodcast ? "收听信息" : "来源信息"}
                </Badge>
                <CardTitle className="text-lg">{item.sourceName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">{item.creatorName}</p>
                  <p className="font-mono text-xs">{item.creatorHandle}</p>
                </div>
                <Separator />
                <div>
                  <p>发布时间</p>
                  <p className="font-medium text-foreground">
                    {formatDateGroup(item.publishedAt)} {formatTime(item.publishedAt)}
                  </p>
                </div>
                {isPodcast && item.duration ? (
                  <div>
                    <p>节目时长</p>
                    <p className="font-medium text-foreground">{item.duration}</p>
                  </div>
                ) : null}
                <div>
                  <p>{isPodcast ? "摘要阅读" : "阅读方式"}</p>
                  <p className="font-medium text-foreground">{item.readTime}</p>
                </div>
                <div>
                  <p>原文语言</p>
                  <p className="font-medium uppercase text-foreground">
                    {item.sourceLanguage}
                  </p>
                </div>
                {isPodcast ? (
                  <div className="space-y-2 pt-1">
                    <Button asChild className="w-full">
                      <a href={contentUrl} target="_blank" rel="noreferrer">
                        立即收听
                        <ArrowUpRight className="size-4" />
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <a href={contentUrl} target="_blank" rel="noreferrer">
                        打开原节目
                        <ArrowUpRight className="size-4" />
                      </a>
                    </Button>
                  </div>
                ) : (
                  <Button asChild className="mt-2 w-full">
                    <a href={contentUrl} target="_blank" rel="noreferrer">
                      查看原文
                      <ArrowUpRight className="size-4" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  )
}
