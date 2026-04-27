"use client"

import { useInfiniteContent } from "@/hooks/use-infinite-content"
import {
  DigestContentCard,
  StandardContentCard,
} from "@/components/site/content-card"
import { Separator } from "@/components/ui/separator"
import { type ContentListItem } from "@/modules/content/public-content.view-model"

export function DeepPageClient({
  initialItems,
  initialCursor,
  initialHasMore,
}: {
  initialItems: ContentListItem[]
  initialCursor: string | null
  initialHasMore: boolean
}) {
  const { items, isLoading, hasMore, sentinelRef } = useInfiniteContent({
    initialItems,
    initialCursor,
    initialHasMore,
    category: "article",
  })

  const [leadItem, ...restItems] = items

  return (
    <>
      {leadItem ? <DigestContentCard item={leadItem} /> : null}

      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
            延伸阅读
          </h2>
          <Separator className="flex-1" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {restItems.map((item) =>
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
