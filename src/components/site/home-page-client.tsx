"use client"

import * as React from "react"
import { ArrowUpRight } from "lucide-react"

import { CategorySidebar } from "@/components/site/category-sidebar"
import { DateGroupHeading } from "@/components/site/date-group-heading"
import {
  DigestContentCard,
  StandardContentCard,
} from "@/components/site/content-card"
import { RevealOnScroll } from "@/components/site/reveal-on-scroll"
import { SiteHeader } from "@/components/site/site-header"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  filterContentItems,
  groupContentItems,
  type CategoryFilter,
  type CategoryOption,
  type ContentListItem,
} from "@/modules/content/public-content.view-model"
import { type SourceDirectoryItem } from "@/modules/sources/source-directory"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

function getSourceInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2)
}

function formatSourceCount(count: number) {
  return `${count} ${count === 1 ? "source" : "sources"}`
}

export function HomePageClient({
  initialItems,
  categories,
  sources = [],
}: {
  initialItems: ContentListItem[]
  categories: CategoryOption[]
  sources?: SourceDirectoryItem[]
}) {
  const [activeCategory, setActiveCategory] = React.useState<CategoryFilter>("all")
  const [showAllSources, setShowAllSources] = React.useState(false)

  const filteredItems = React.useMemo(
    () => filterContentItems(initialItems, activeCategory),
    [activeCategory, initialItems]
  )
  const dateGroups = React.useMemo(
    () => groupContentItems(filteredItems),
    [filteredItems]
  )
  const marqueeSources = React.useMemo(
    () => (sources.length > 1 ? [...sources, ...sources] : sources),
    [sources]
  )

  return (
    <div className="min-h-screen">
      <SiteHeader
        activeNav="home"
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      <main className="app-shell pb-24 pt-8">
        <section className="mb-7">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-[2rem]">
            AI 内容流
          </h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            按日期整理的文章与动态。
          </p>
        </section>

        {sources.length > 0 ? (
          <section className="mb-8">
            <div className="source-rail overflow-hidden rounded-[1.7rem] border border-white/55 bg-background/58 px-3 py-2 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.22)] supports-backdrop-filter:backdrop-blur-xl sm:px-3.5">
              <div className="flex items-center gap-2.5">
                <div className="shrink-0 rounded-[1.1rem] border border-white/55 bg-white/72 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] dark:bg-white/8">
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    数据源
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {formatSourceCount(sources.length)}
                  </p>
                </div>

                <div className="relative min-w-0 flex-1 overflow-hidden">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r from-background/95 to-transparent" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-linear-to-l from-background/95 to-transparent" />

                  <div
                    className="source-rail-track py-0.5 motion-reduce:animate-none"
                    data-static={sources.length <= 1 ? "true" : "false"}
                  >
                    {marqueeSources.map((source, index) => (
                      <HoverCard key={`${source.id}-${index}`}>
                        <HoverCardTrigger asChild>
                          <a
                            href={source.href}
                            target="_blank"
                            rel="noreferrer"
                            className="group/source flex h-13.5 w-[184px] shrink-0 items-center gap-2.5 rounded-[1rem] border border-white/60 bg-white/72 px-2.5 py-2 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.26)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-white/88 dark:bg-white/8 dark:hover:bg-white/12"
                          >
                            <Avatar className="shadow-sm">
                              {source.avatarUrl ? (
                                <AvatarImage
                                  src={source.avatarUrl}
                                  alt={`${source.name} 头像`}
                                />
                              ) : null}
                              <AvatarFallback>
                                {getSourceInitials(source.name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {source.name}
                                </p>
                                <Badge
                                  variant="outline"
                                  className="h-4 rounded-full border-white/65 bg-background/72 px-1.5 text-[10px] text-muted-foreground"
                                >
                                  {source.typeLabel}
                                </Badge>
                              </div>
                              <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                                {source.handle ? `@${source.handle}` : "查看来源主页"}
                              </p>
                            </div>
                          </a>
                        </HoverCardTrigger>

                        <HoverCardContent
                          align="start"
                          className="w-64 rounded-[1.2rem] border-white/60 bg-background/88"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar size="lg" className="shadow-sm">
                              {source.avatarUrl ? (
                                <AvatarImage
                                  src={source.avatarUrl}
                                  alt={`${source.name} 头像`}
                                />
                              ) : null}
                              <AvatarFallback>
                                {getSourceInitials(source.name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {source.name}
                                </p>
                                <Badge
                                  variant="outline"
                                  className="rounded-full border-white/55 bg-background/78 text-[10px] text-muted-foreground"
                                >
                                  {source.typeLabel}
                                </Badge>
                              </div>
                              {source.handle ? (
                                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                                  @{source.handle}
                                </p>
                              ) : null}
                              <p className="mt-2.5 leading-6 text-muted-foreground">
                                {source.description}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3.5">
                            <Button asChild size="sm" variant="outline">
                              <a href={source.href} target="_blank" rel="noreferrer">
                                查看主页
                                <ArrowUpRight className="size-4" />
                              </a>
                            </Button>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                  </div>
                </div>

                {sources.length > 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0 rounded-full border-white/60 bg-white/68 px-3 text-[11px] text-foreground/88 hover:bg-white/82 dark:bg-white/8"
                    onClick={() => setShowAllSources((current) => !current)}
                  >
                    {showAllSources ? "收起来源" : "展开全部来源"}
                  </Button>
                ) : null}
              </div>
            </div>

            {showAllSources ? (
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {sources.map((source) => (
                  <a
                    key={`expanded-${source.id}`}
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-[1.15rem] border border-white/55 bg-white/68 px-3 py-3 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.18)] transition-colors hover:border-primary/25 hover:bg-white/84 dark:bg-white/8"
                  >
                    <Avatar className="shadow-sm">
                      {source.avatarUrl ? (
                        <AvatarImage
                          src={source.avatarUrl}
                          alt={`${source.name} 头像`}
                        />
                      ) : null}
                      <AvatarFallback>{getSourceInitials(source.name)}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {source.name}
                        </p>
                        <Badge
                          variant="outline"
                          className="rounded-full border-white/55 bg-background/78 text-[10px] text-muted-foreground"
                        >
                          {source.typeLabel}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                        {source.handle ? `@${source.handle}` : source.href}
                      </p>
                    </div>

                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                  </a>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
          <div className="hidden xl:block">
            <CategorySidebar
              categories={categories}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
            />
          </div>

          <div className="space-y-10">
            <div className="xl:hidden">
              <Tabs
                value={activeCategory}
                onValueChange={(value) => setActiveCategory(value as CategoryFilter)}
              >
                <TabsList className="grid h-auto grid-cols-3 gap-2 rounded-3xl bg-transparent p-0 sm:grid-cols-3">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="rounded-2xl border border-border/70 bg-background/80 px-3 py-3 text-xs data-[state=active]:border-primary/25 data-[state=active]:bg-primary/8 data-[state=active]:text-primary"
                    >
                      {category.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="relative pl-8 sm:pl-10">
              <div className="pointer-events-none absolute left-3 top-3 bottom-0 w-px bg-linear-to-b from-primary/18 via-border/80 to-transparent sm:left-4" />

              {dateGroups.map((group, groupIndex) => (
                <section key={group.key} className="timeline-section relative space-y-5 pb-10 last:pb-0">
                  <RevealOnScroll delay={groupIndex * 80}>
                    <div className="sticky top-20 z-10 -mx-2 rounded-2xl bg-background/78 px-2 py-1 supports-backdrop-filter:backdrop-blur-md sm:top-22">
                      <div className="absolute top-3 -left-6 flex h-8 w-8 items-center justify-center sm:-left-8 sm:h-9 sm:w-9">
                        <span className="timeline-dot" />
                      </div>
                      <DateGroupHeading label={group.label} count={group.items.length} />
                    </div>
                  </RevealOnScroll>

                  <div className="grid gap-5 md:grid-cols-2">
                    {group.items.map((item, itemIndex) => {
                      const delay = Math.min(240, 110 + itemIndex * 55)

                      return item.cardType === "digest" ? (
                        <RevealOnScroll
                          key={item.slug}
                          delay={delay}
                          className="md:col-span-2"
                        >
                          <DigestContentCard item={item} />
                        </RevealOnScroll>
                      ) : (
                        <RevealOnScroll key={item.slug} delay={delay}>
                          <StandardContentCard item={item} />
                        </RevealOnScroll>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
