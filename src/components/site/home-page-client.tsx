"use client"

import * as React from "react"

import { CategorySidebar } from "@/components/site/category-sidebar"
import { DateGroupHeading } from "@/components/site/date-group-heading"
import {
  DigestContentCard,
  StandardContentCard,
} from "@/components/site/content-card"
import { RevealOnScroll } from "@/components/site/reveal-on-scroll"
import { SiteHeader } from "@/components/site/site-header"
import {
  filterContentItems,
  groupContentItems,
  type CategoryFilter,
  type CategoryOption,
  type ContentListItem,
} from "@/modules/content/public-content.view-model"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function HomePageClient({
  initialItems,
  categories,
}: {
  initialItems: ContentListItem[]
  categories: CategoryOption[]
}) {
  const [activeCategory, setActiveCategory] = React.useState<CategoryFilter>("all")

  const filteredItems = React.useMemo(
    () => filterContentItems(initialItems, activeCategory),
    [activeCategory, initialItems]
  )
  const dateGroups = React.useMemo(
    () => groupContentItems(filteredItems),
    [filteredItems]
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
