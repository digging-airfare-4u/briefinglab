"use client"

import { useInfiniteContent } from "@/hooks/use-infinite-content"
import { DateGroupHeading } from "@/components/site/date-group-heading"
import {
  DigestContentCard,
  StandardContentCard,
} from "@/components/site/content-card"
import {
  groupContentItems,
  type ContentListItem,
  type DailySummaryViewModel,
} from "@/modules/content/public-content.view-model"

export function LatestPageClient({
  initialItems,
  dailySummaries,
  initialCursor,
  initialHasMore,
}: {
  initialItems: ContentListItem[]
  dailySummaries: Record<string, DailySummaryViewModel>
  initialCursor: string | null
  initialHasMore: boolean
}) {
  const { items, isLoading, hasMore, sentinelRef } = useInfiniteContent({
    initialItems,
    initialCursor,
    initialHasMore,
  })

  const groups = groupContentItems(items, dailySummaries)

  return (
    <>
      {groups.map((group) => (
        <section key={group.key} className="space-y-4">
          <DateGroupHeading label={group.label} count={group.items.length} />
          <div className="grid gap-4 md:grid-cols-2">
            {group.items.map((item) =>
              item.cardType === "digest" ? (
                <div key={item.slug} className="md:col-span-2">
                  <DigestContentCard item={item} />
                </div>
              ) : (
                <StandardContentCard key={item.slug} item={item} />
              )
            )}
          </div>
        </section>
      ))}

      {hasMore ? (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {isLoading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          ) : null}
        </div>
      ) : items.length > 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          已加载全部内容
        </p>
      ) : null}
    </>
  )
}
