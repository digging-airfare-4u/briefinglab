"use client"

import * as React from "react"

import {
  feedItemToContentListItem,
  type CategoryFilter,
  type ContentListItem,
  type FeedApiResponse,
} from "@/modules/content/public-content.view-model"

const PAGE_SIZE = 20

type UseInfiniteContentOptions = {
  initialItems: ContentListItem[]
  initialCursor: string | null
  initialHasMore: boolean
  category?: CategoryFilter
}

export function useInfiniteContent({
  initialItems,
  initialCursor,
  initialHasMore,
  category = "all",
}: UseInfiniteContentOptions) {
  const [items, setItems] = React.useState(initialItems)
  const [cursor, setCursor] = React.useState(initialCursor)
  const [hasMore, setHasMore] = React.useState(initialHasMore)
  const [isLoading, setIsLoading] = React.useState(false)
  const sentinelRef = React.useRef<HTMLDivElement | null>(null)
  const loadingRef = React.useRef(false)

  React.useEffect(() => {
    setItems(initialItems)
    setCursor(initialCursor)
    setHasMore(initialHasMore)
  }, [initialItems, initialCursor, initialHasMore])

  const loadMore = React.useCallback(async () => {
    if (loadingRef.current || !hasMore || !cursor) return
    loadingRef.current = true
    setIsLoading(true)

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        cursor,
      })

      if (category !== "all") {
        params.set("category", category)
      }

      const response = await fetch(`/api/content/feed?${params}`)
      const data: FeedApiResponse = await response.json()

      const newItems = data.groups.flatMap((group) =>
        group.items.map(feedItemToContentListItem)
      )

      setItems((prev) => {
        const existingSlugs = new Set(prev.map((item) => item.slug))
        const deduped = newItems.filter((item) => !existingSlugs.has(item.slug))
        return [...prev, ...deduped]
      })
      setCursor(data.pagination.nextCursor)
      setHasMore(data.pagination.hasMore)
    } finally {
      setIsLoading(false)
      loadingRef.current = false
    }
  }, [cursor, hasMore, category])

  React.useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: "0px 0px 400px 0px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  return { items, isLoading, hasMore, sentinelRef }
}
