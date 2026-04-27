import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import {
  getPublicContentDetail,
  getPublicFeed,
  type PublicContentDetail,
  type PublicFeedItem,
} from "@/modules/content/public-content.service"
import { resolveDetailMode } from "@/modules/content/content-complexity"
import {
  type CategoryOption,
  type ContentDetailItem,
  type ContentListItem,
  type DailySummaryViewModel,
} from "@/modules/content/public-content.view-model"
import {
  listSourceDirectoryItems,
  type SourceDirectoryItem,
} from "@/modules/sources/source-directory"
import {
  createSupabaseDailySummaryRepository,
  type DailySummaryRecord,
} from "@/modules/summaries/daily-summary.repository"

function toDailySummaryViewModel(
  record: DailySummaryRecord
): DailySummaryViewModel {
  return {
    summary: record.summary,
    bullets: record.bullets,
    highlights: record.highlights,
  }
}

async function fetchDailySummariesForItems(items: ContentListItem[]) {
  const dates = Array.from(new Set(items.map((item) => item.publishedAt.slice(0, 10))))
  if (dates.length === 0) return {}

  try {
    const repository = createSupabaseDailySummaryRepository(
      getSupabaseAdminClient() as unknown as Parameters<
        typeof createSupabaseDailySummaryRepository
      >[0]
    )

    const records = await repository.listByDates(dates)
    const map: Record<string, DailySummaryViewModel> = {}

    for (const record of records) {
      map[record.date] = toDailySummaryViewModel(record)
    }

    return map
  } catch {
    return {}
  }
}

async function fetchRecentDailySummaries(dayCount = 30) {
  const dates = Array.from({ length: dayCount }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().slice(0, 10)
  })

  try {
    const repository = createSupabaseDailySummaryRepository(
      getSupabaseAdminClient() as unknown as Parameters<
        typeof createSupabaseDailySummaryRepository
      >[0]
    )

    const records = await repository.listByDates(dates)
    const map: Record<string, DailySummaryViewModel> = {}

    for (const record of records) {
      map[record.date] = toDailySummaryViewModel(record)
    }

    return map
  } catch {
    return {}
  }
}

function toContentListItem(item: PublicFeedItem): ContentListItem {
  const legacyUrl =
    "url" in (item as PublicFeedItem & { url?: string })
      ? (item as PublicFeedItem & { url?: string }).url
      : undefined

  return {
    id: item.id,
    slug: item.slug,
    kind: item.kind,
    title: item.title ?? "",
    contentUrl: item.contentUrl ?? legacyUrl ?? item.source.url,
    excerpt: item.excerpt,
    summary: item.summary.text,
    bullets: item.summary.bullets,
    hasSummary: !item.summary.isFallback,
    editorialTake: item.editorialTake,
    category: item.category,
    cardType: item.cardType,
    sourceName: item.source.name,
    sourceUrl: item.source.url,
    creatorName: item.creator.name,
    creatorHandle: item.creator.handle ?? "",
    publishedAt: item.publishedAt,
    readTime: item.readTime,
    badges: item.badges,
  }
}

function toDetailPageData(item: PublicContentDetail) {
  const translation = item.body.translation
  const englishSummary = item.summaries.en
  const originalText = item.body.original.text ?? undefined
  const translatedText = translation?.text ?? undefined
  const detailMode = resolveDetailMode({
    kind: item.kind,
    timelineLength: item.timeline?.length,
    summary: item.summary.text,
    originalText,
    translatedText,
  })

  return {
    item: {
      ...toContentListItem(item),
      detailMode,
      sourceLanguage: item.body.original.locale,
      duration: item.duration,
      timeline: item.timeline,
      originalTitle: item.body.original.title ?? undefined,
      translatedTitle: translation?.title ?? undefined,
      originalText,
      translatedText,
      englishSummary: englishSummary?.summary ?? undefined,
      englishBullets: englishSummary?.bullets ?? [],
    } satisfies ContentDetailItem,
    relatedItems: item.relatedItems.map(toContentListItem),
  }
}

const INITIAL_PAGE_SIZE = 20

export async function getHomePageData(): Promise<{
  items: ContentListItem[]
  categories: CategoryOption[]
  sources: SourceDirectoryItem[]
  dailySummaries: Record<string, DailySummaryViewModel>
  nextCursor: string | null
  hasMore: boolean
}> {
  const feed = await getPublicFeed({ limit: INITIAL_PAGE_SIZE })
  const items = feed.groups.flatMap((group) =>
    group.items.map(toContentListItem)
  )
  const categories: CategoryOption[] = [
    { id: "all", label: "全部内容", description: "今日所有 AI 动向", count: feed.filters.counts.all },
    { id: "article", label: "文章", description: "播客、博客、日报与长文解读", count: feed.filters.counts.article },
    { id: "news", label: "动态", description: "X 快讯、发布与行业变化", count: feed.filters.counts.news },
  ]
  const sources = listSourceDirectoryItems()

  return {
    items,
    categories,
    sources,
    dailySummaries: await fetchRecentDailySummaries(),
    nextCursor: feed.pagination.nextCursor,
    hasMore: feed.pagination.hasMore,
  }
}

export async function getLatestPageData(): Promise<{
  items: ContentListItem[]
  dailySummaries: Record<string, DailySummaryViewModel>
  nextCursor: string | null
  hasMore: boolean
}> {
  const feed = await getPublicFeed({ limit: INITIAL_PAGE_SIZE })
  const items = feed.groups.flatMap((group) =>
    group.items.map(toContentListItem)
  )

  return {
    items,
    dailySummaries: await fetchRecentDailySummaries(),
    nextCursor: feed.pagination.nextCursor,
    hasMore: feed.pagination.hasMore,
  }
}

export async function getDeepPageData(): Promise<{
  items: ContentListItem[]
  nextCursor: string | null
  hasMore: boolean
}> {
  const feed = await getPublicFeed({ limit: INITIAL_PAGE_SIZE, category: "article" })
  const items = feed.groups.flatMap((group) =>
    group.items.map(toContentListItem)
  )

  return {
    items,
    nextCursor: feed.pagination.nextCursor,
    hasMore: feed.pagination.hasMore,
  }
}

export async function getContentDetailPageData(slug: string): Promise<{
  item: ContentDetailItem
  relatedItems: ContentListItem[]
} | null> {
  const item = await getPublicContentDetail(slug)

  return item ? toDetailPageData(item) : null
}
