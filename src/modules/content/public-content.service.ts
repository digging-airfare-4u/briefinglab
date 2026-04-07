import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import {
  type PublicContentClient,
  createSupabasePublicContentRepository,
  type PublicContentRepository,
  type PublicContentRow,
} from "@/modules/content/public-content.repository"
import { formatDateGroup } from "@/modules/content/public-content.view-model"

export type PublicSummary = {
  locale: "zh" | "en"
  text: string
  bullets: string[]
}

export type PublicSummaryVariant = {
  locale: "zh" | "en"
  summary: string
  bullets: string[]
}

export type PublicSummaryCollection = Partial<
  Record<"zh" | "en", PublicSummaryVariant>
>

export type FeedCategory = "news" | "article"
export type CategoryFilter = "all" | FeedCategory
export type CardType = "standard" | "digest"

export type PublicFeedItem = {
  id: string
  slug: string
  category: FeedCategory
  cardType: CardType
  title: string | null
  excerpt: string
  summary: PublicSummary
  creator: {
    name: string
    handle?: string
  }
  source: {
    name: string
    url: string
  }
  publishedAt: string
  readTime: string
  badges: string[]
  editorialTake?: string
}

export type PublicFeedGroup = {
  key: string
  label: string
  items: PublicFeedItem[]
}

export type PublicFeedResponse = {
  groups: PublicFeedGroup[]
  filters: {
    category: CategoryFilter
    source: string | null
    counts: Record<CategoryFilter, number>
  }
  pagination: {
    limit: number
    nextCursor: string | null
    hasMore: boolean
  }
}

export type PublicContentBody = {
  locale: string
  title: string | null
  text: string | null
}

export type PublicContentDetail = PublicFeedItem & {
  summaries: PublicSummaryCollection
  body: {
    original: PublicContentBody
    translation: PublicContentBody | null
  }
  relatedItems: PublicFeedItem[]
}

export type PublicFeedQuery = {
  category?: CategoryFilter
  cursor?: string
  limit?: number
  source?: string
}

type CursorPayload = {
  publishedAt: string
  slug: string
}

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50
let cachedService: ReturnType<typeof createPublicContentService> | null = null

function sortByPublishedAtDesc<T extends { publishedAt: string; slug: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    if (left.publishedAt === right.publishedAt) {
      return left.slug < right.slug ? 1 : -1
    }

    return left.publishedAt < right.publishedAt ? 1 : -1
  })
}

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function decodeHtmlEntities(value: string) {
  return value.replace(
    /&(amp|lt|gt|quot|#39|nbsp);/g,
    (match, entity: string) => {
      switch (entity) {
        case "amp":
          return "&"
        case "lt":
          return "<"
        case "gt":
          return ">"
        case "quot":
          return '"'
        case "#39":
          return "'"
        case "nbsp":
          return " "
        default:
          return match
      }
    }
  )
}

function cleanDecodedText(value: string) {
  return cleanText(decodeHtmlEntities(value))
}

function firstNonEmptyString(candidates: Array<string | null | undefined>) {
  return candidates.find(
    (candidate) => typeof candidate === "string" && cleanText(candidate).length > 0
  )
}

function toCategory(kind: PublicContentRow["kind"]): FeedCategory {
  switch (kind) {
    case "tweet":
      return "news"
    case "podcast_episode":
    case "blog_post":
      return "article"
  }
}

function toSummaryVariant(summary: PublicSummary): PublicSummaryVariant {
  return {
    locale: summary.locale,
    summary: summary.text,
    bullets: summary.bullets,
  }
}

function getSummaryCollection(row: PublicContentRow): PublicSummaryCollection {
  const collection: PublicSummaryCollection = {}

  for (const summary of row.summaries) {
    if (summary.locale === "zh" || summary.locale === "en") {
      collection[summary.locale] = {
        locale: summary.locale,
        summary: summary.summary,
        bullets: summary.bullets,
      }
    }
  }

  return collection
}

function getPreferredTranslation(row: PublicContentRow, locale: "zh" | "en" = "zh") {
  return row.translations.find((translation) => translation.locale === locale)
}

function getDisplayText(candidates: Array<string | null | undefined>) {
  const value = candidates.find(
    (candidate) => typeof candidate === "string" && candidate.trim().length > 0
  )

  return value ? decodeHtmlEntities(value).trim() : ""
}

function getSourceText(row: PublicContentRow) {
  return cleanDecodedText(
    firstNonEmptyString([
      row.transcriptText,
      row.plainText,
      typeof row.rawPayload.text === "string" ? row.rawPayload.text : undefined,
      typeof row.rawPayload.description === "string"
        ? row.rawPayload.description
        : undefined,
      typeof row.rawPayload.content === "string" ? row.rawPayload.content : undefined,
    ]) ?? ""
  )
}

function buildTitleFallback(row: PublicContentRow, summary: PublicSummary) {
  const translation = getPreferredTranslation(row)
  const fallbackText = cleanDecodedText(
    firstNonEmptyString([
      translation?.title,
      row.title,
      translation?.plainText,
      translation?.transcriptText,
      row.plainText,
      row.transcriptText,
      typeof row.rawPayload.text === "string" ? row.rawPayload.text : undefined,
      typeof row.rawPayload.description === "string"
        ? row.rawPayload.description
        : undefined,
      summary.text,
      row.sourceName,
    ]) ?? row.sourceName
  )

  return truncate(fallbackText, 72)
}

function getPrimarySummary(row: PublicContentRow): PublicSummary {
  const zhSummary = row.summaries.find((summary) => summary.locale === "zh")

  if (zhSummary) {
    return {
      locale: "zh",
      text: zhSummary.summary,
      bullets: zhSummary.bullets,
    }
  }

  const enSummary = row.summaries.find((summary) => summary.locale === "en")

  if (enSummary) {
    return {
      locale: "en",
      text: enSummary.summary,
      bullets: enSummary.bullets,
    }
  }

  const fallbackText = cleanText(
    firstNonEmptyString([getSourceText(row), row.title, "摘要暂未生成。"]) ??
      "摘要暂未生成。"
  )

  const fragments = fallbackText
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map(cleanText)
    .filter(Boolean)

  return {
    locale: "zh",
    text: truncate(fallbackText || "摘要暂未生成。", 180),
    bullets:
      fragments.slice(0, 3).map((fragment) => truncate(fragment, 120)) ?? [],
  }
}

function buildExcerpt(row: PublicContentRow, summary: PublicSummary) {
  const translation = getPreferredTranslation(row)
  const fallback = cleanDecodedText(
    translation?.plainText ??
      translation?.transcriptText ??
      summary.text ??
      row.plainText ??
      row.transcriptText ??
      row.title ??
      row.sourceName
  )

  return truncate(fallback, 110)
}

function buildReadTime(row: PublicContentRow, category: FeedCategory) {
  const sourceText = cleanDecodedText(
    row.transcriptText ?? row.plainText ?? row.title ?? row.sourceName
  )
  const minutes = Math.max(1, Math.ceil(sourceText.length / 420))

  return category === "article" ? `${minutes} 分钟摘要` : `${minutes} 分钟`
}

function buildBadges(row: PublicContentRow, summary: PublicSummary) {
  const badges = new Set<string>()
  const translation = getPreferredTranslation(row)

  switch (row.kind) {
    case "tweet":
      badges.add("动态")
      break
    case "podcast_episode":
      badges.add("播客")
      break
    case "blog_post":
      badges.add("文章")
      break
  }

  if (summary.locale === "zh") {
    badges.add("中文摘要")
  }

  if (translation) {
    badges.add("全文翻译")
  }

  return Array.from(badges)
}

function buildEditorialTake(row: PublicContentRow) {
  const value = row.rawPayload.editorialTake
  return typeof value === "string" ? value : undefined
}

function toPublicFeedItem(row: PublicContentRow): PublicFeedItem {
  const category = toCategory(row.kind)
  const summary = getPrimarySummary(row)
  const translation = getPreferredTranslation(row)
  const title = translation?.title ?? row.title ?? buildTitleFallback(row, summary)

  return {
    id: row.id,
    slug: row.slug,
    category,
    cardType: category === "article" ? "digest" : "standard",
    title,
    excerpt: buildExcerpt(row, summary),
    summary,
    creator: {
      name: row.creatorName,
      handle: row.creatorHandle,
    },
    source: {
      name: row.sourceName,
      url: row.sourceUrl,
    },
    publishedAt: row.publishedAt,
    readTime: buildReadTime(row, category),
    badges: buildBadges(row, summary),
    editorialTake: buildEditorialTake(row),
  }
}

function buildDetailBody(row: PublicContentRow) {
  const translation = getPreferredTranslation(row)
  const sourceText = getDisplayText([
    row.transcriptText,
    row.plainText,
    typeof row.rawPayload.text === "string" ? row.rawPayload.text : undefined,
    typeof row.rawPayload.description === "string"
      ? row.rawPayload.description
      : undefined,
    typeof row.rawPayload.content === "string" ? row.rawPayload.content : undefined,
  ])
  const translatedText = getDisplayText([
    translation?.transcriptText,
    translation?.plainText,
  ])

  return {
    original: {
      locale: row.language ?? "en",
      title: row.title,
      text: sourceText || null,
    },
    translation: translation
      ? {
          locale: translation.locale,
          title: translation.title ?? null,
          text: translatedText || null,
        }
      : null,
  } satisfies PublicContentDetail["body"]
}

function parseCursor(cursor?: string): CursorPayload | null {
  if (!cursor) {
    return null
  }

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8")
    const parsed = JSON.parse(decoded) as CursorPayload

    if (!parsed.slug || !parsed.publishedAt) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function encodeCursor(item: PublicContentRow) {
  return Buffer.from(
    JSON.stringify({
      publishedAt: item.publishedAt,
      slug: item.slug,
    } satisfies CursorPayload),
    "utf8"
  ).toString("base64url")
}

function clampLimit(limit?: number) {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_LIMIT
  }

  return Math.min(Math.max(limit, 1), MAX_LIMIT)
}

function getCategoryCounts(rows: PublicContentRow[]) {
  return rows.reduce<Record<CategoryFilter, number>>(
    (accumulator, row) => {
      accumulator.all += 1
      accumulator[toCategory(row.kind)] += 1
      return accumulator
    },
    {
      all: 0,
      article: 0,
      news: 0,
    }
  )
}

function groupPublicFeedItems(rows: PublicContentRow[]): PublicFeedGroup[] {
  const groups = new Map<string, PublicContentRow[]>()

  for (const row of rows) {
    const key = row.publishedAt.slice(0, 10)
    groups.set(key, [...(groups.get(key) ?? []), row])
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => (left < right ? 1 : -1))
    .map(([key, groupRows]) => ({
      key,
      label: formatDateGroup(groupRows[0].publishedAt),
      items: sortByPublishedAtDesc(groupRows).map(toPublicFeedItem),
    }))
}

function filterBySource(rows: PublicContentRow[], source?: string) {
  if (!source) {
    return rows
  }

  return rows.filter((row) => row.sourceName === source)
}

function filterByCategory(rows: PublicContentRow[], category: CategoryFilter) {
  if (category === "all") {
    return rows
  }

  return rows.filter((row) => toCategory(row.kind) === category)
}

function findCursorIndex(rows: PublicContentRow[], cursor?: string) {
  const parsed = parseCursor(cursor)

  if (!parsed) {
    return -1
  }

  return rows.findIndex(
    (row) =>
      row.slug === parsed.slug && row.publishedAt === parsed.publishedAt
  )
}

function buildRelatedItems(rows: PublicContentRow[], target: PublicContentRow) {
  const targetCategory = toCategory(target.kind)

  return rows
    .filter((row) => row.slug !== target.slug && toCategory(row.kind) === targetCategory)
    .sort((left, right) => {
      const leftScore = Number(left.sourceName === target.sourceName)
      const rightScore = Number(right.sourceName === target.sourceName)

      if (leftScore !== rightScore) {
        return rightScore - leftScore
      }

      if (left.publishedAt === right.publishedAt) {
        return left.slug < right.slug ? 1 : -1
      }

      return left.publishedAt < right.publishedAt ? 1 : -1
    })
    .slice(0, 3)
    .map(toPublicFeedItem)
}

export function createPublicContentService(repository: PublicContentRepository) {
  return {
    async getPublicFeed({
      category = "all",
      cursor,
      limit,
      source,
    }: PublicFeedQuery = {}): Promise<PublicFeedResponse> {
      const normalizedLimit = clampLimit(limit)
      const rows = await repository.listPublishedRows()
      const sourceFilteredRows = filterBySource(rows, source)
      const counts = getCategoryCounts(sourceFilteredRows)
      const categoryFilteredRows = sortByPublishedAtDesc(
        filterByCategory(sourceFilteredRows, category)
      )

      const cursorIndex = findCursorIndex(categoryFilteredRows, cursor)
      const startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0
      const pagedRows = categoryFilteredRows.slice(
        startIndex,
        startIndex + normalizedLimit
      )
      const hasMore = startIndex + normalizedLimit < categoryFilteredRows.length
      const lastItem = pagedRows.at(-1)

      return {
        groups: groupPublicFeedItems(pagedRows),
        filters: {
          category,
          source: source ?? null,
          counts,
        },
        pagination: {
          limit: normalizedLimit,
          nextCursor: hasMore && lastItem ? encodeCursor(lastItem) : null,
          hasMore,
        },
      }
    },
    async listPublicFeedItems({
      category = "all",
      source,
    }: {
      category?: CategoryFilter
      source?: string
    } = {}) {
      const rows = await repository.listPublishedRows()

      return sortByPublishedAtDesc(
        filterByCategory(filterBySource(rows, source), category)
      ).map(toPublicFeedItem)
    },
    async getPublicContentDetail(
      slug: string
    ): Promise<PublicContentDetail | null> {
      const row = await repository.getPublishedRowBySlug(slug)

      if (!row) {
        return null
      }

      const allRows = await repository.listPublishedRows()
      const summaries = getSummaryCollection(row)
      const primarySummary = getPrimarySummary(row)

      return {
        ...toPublicFeedItem(row),
        summary: primarySummary,
        summaries: {
          ...summaries,
          ...(primarySummary.locale === "zh" || primarySummary.locale === "en"
            ? { [primarySummary.locale]: toSummaryVariant(primarySummary) }
            : {}),
        },
        body: buildDetailBody(row),
        relatedItems: buildRelatedItems(allRows, row),
      }
    },
  }
}

function getDefaultPublicContentService() {
  if (!cachedService) {
    cachedService = createPublicContentService(
      createSupabasePublicContentRepository(
        getSupabaseAdminClient() as unknown as PublicContentClient
      )
    )
  }

  return cachedService
}

export async function getPublicFeed(query: PublicFeedQuery = {}) {
  return getDefaultPublicContentService().getPublicFeed(query)
}

export async function listPublicFeedItems(query: {
  category?: CategoryFilter
  source?: string
} = {}) {
  return getDefaultPublicContentService().listPublicFeedItems(query)
}

export async function getPublicContentDetail(slug: string) {
  return getDefaultPublicContentService().getPublicContentDetail(slug)
}
