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
  isFallback: boolean
}

export type PublicSummaryVariant = {
  locale: "zh" | "en"
  summary: string
  bullets: string[]
  isFallback: boolean
}

export type PublicSummaryCollection = Partial<
  Record<"zh" | "en", PublicSummaryVariant>
>

export type FeedCategory = "news" | "article"
export type CategoryFilter = "all" | FeedCategory
export type CardType = "standard" | "digest"
export type PublicContentKind = PublicContentRow["kind"]

export type PublicFeedItem = {
  id: string
  slug: string
  kind: PublicContentKind
  category: FeedCategory
  cardType: CardType
  title: string | null
  contentUrl: string
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

export type PublicContentTimelineItem = {
  start: string
  end?: string
  title: string
  speaker?: string
}

export type PublicContentDetail = PublicFeedItem & {
  summaries: PublicSummaryCollection
  duration?: string
  timeline: PublicContentTimelineItem[]
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
const GENERATED_TITLE_MAX_LENGTH = 56
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

function stripUrls(value: string) {
  return value.replace(/https?:\/\/\S+|www\.\S+/gi, " ")
}

function extractFirstSentence(value: string) {
  return value.split(/(?<=[.!?。！？])\s+|\n+/)[0] ?? value
}

function normalizeGeneratedTitle(value: string) {
  const sentence = extractFirstSentence(cleanDecodedText(stripUrls(value)))

  return cleanText(
    sentence
      .replace(/^[^A-Za-z0-9\u3400-\u9FFF]+/g, "")
      .replace(/\s*[-:：|｜]+\s*$/g, "")
  )
}

function isMeaningfulGeneratedTitle(value: string) {
  if (!value || !/[A-Za-z0-9\u3400-\u9FFF]/.test(value)) {
    return false
  }

  const normalized = value.toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]/g, "")

  if (!normalized) {
    return false
  }

  return !new Set(["link", "links", "url", "链接"]).has(normalized)
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
    isFallback: summary.isFallback,
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

function timestampToSeconds(value: string) {
  const parts = value.split(":").map((segment) => Number(segment))

  if (parts.some((segment) => Number.isNaN(segment))) {
    return null
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts
    return minutes * 60 + seconds
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    return hours * 3600 + minutes * 60 + seconds
  }

  return null
}

function formatTimestampFromSeconds(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

type TranscriptSegment = {
  start: string
  end?: string
  startSeconds: number
  endSeconds?: number
  speaker?: string
  title: string
}

function extractTranscriptSegments(text: string): TranscriptSegment[] {
  const lines = decodeHtmlEntities(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
  const segments: TranscriptSegment[] = []
  const timelinePattern =
    /^(?:([^|]+?)\s*\|\s*)?(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)(?:\s+(.*))?$/

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index]?.match(timelinePattern)

    if (!match) {
      continue
    }

    const [, speakerRaw, start, end, bodyRaw] = match
    const startSeconds = timestampToSeconds(start)
    const endSeconds = timestampToSeconds(end)

    if (startSeconds === null) {
      continue
    }

    let body = cleanDecodedText(bodyRaw ?? "")

    if (!body) {
      const nextLine = lines[index + 1]
      if (nextLine && !timelinePattern.test(nextLine)) {
        body = cleanDecodedText(nextLine)
        index += 1
      }
    }

    const title = truncate(
      cleanText(
        extractFirstSentence(body || `${cleanText(speakerRaw ?? "")} 对话片段`)
      ),
      88
    )

    if (!title) {
      continue
    }

    segments.push({
      start,
      end,
      startSeconds,
      endSeconds: endSeconds ?? undefined,
      speaker: cleanText(speakerRaw ?? "") || undefined,
      title,
    })
  }

  return segments
}

function buildTimeline(row: PublicContentRow): PublicContentTimelineItem[] {
  if (row.kind !== "podcast_episode") {
    return []
  }

  const transcript = firstNonEmptyString([row.transcriptText, row.plainText]) ?? ""
  const segments = extractTranscriptSegments(transcript)

  if (segments.length === 0) {
    return []
  }

  if (segments.length <= 6) {
    return segments.map(({ start, end, title, speaker }) => ({
      start,
      end,
      title,
      speaker,
    }))
  }

  const lastSeconds =
    segments.at(-1)?.endSeconds ?? segments.at(-1)?.startSeconds ?? 0
  const gap = Math.max(6 * 60, Math.floor(lastSeconds / 5))
  const selected: TranscriptSegment[] = [segments[0]]
  let lastSelectedSeconds = segments[0]?.startSeconds ?? 0

  for (const segment of segments.slice(1, -1)) {
    if (segment.startSeconds - lastSelectedSeconds < gap) {
      continue
    }

    selected.push(segment)
    lastSelectedSeconds = segment.startSeconds

    if (selected.length >= 5) {
      break
    }
  }

  const lastSegment = segments.at(-1)
  if (
    lastSegment &&
    selected[selected.length - 1]?.start !== lastSegment.start &&
    selected.length < 6
  ) {
    selected.push(lastSegment)
  }

  return selected.map(({ start, end, title, speaker }) => ({
    start,
    end,
    title,
    speaker,
  }))
}

function buildDuration(row: PublicContentRow) {
  if (row.kind !== "podcast_episode") {
    return undefined
  }

  const transcript = firstNonEmptyString([row.transcriptText, row.plainText]) ?? ""
  const segments = extractTranscriptSegments(transcript)
  const lastSeconds =
    segments.at(-1)?.endSeconds ?? segments.at(-1)?.startSeconds ?? null

  return lastSeconds === null ? undefined : formatTimestampFromSeconds(lastSeconds)
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
  const titleCandidates = [
    translation?.plainText,
    translation?.transcriptText,
    row.plainText,
    row.transcriptText,
    typeof row.rawPayload.text === "string" ? row.rawPayload.text : undefined,
    typeof row.rawPayload.description === "string"
      ? row.rawPayload.description
      : undefined,
    summary.isFallback ? undefined : summary.text,
  ]

  for (const candidate of titleCandidates) {
    if (!candidate) {
      continue
    }

    const normalized = normalizeGeneratedTitle(candidate)

    if (isMeaningfulGeneratedTitle(normalized)) {
      return truncate(normalized, GENERATED_TITLE_MAX_LENGTH)
    }
  }

  if (row.kind === "tweet") {
    return `${row.creatorName} 的动态`
  }

  if (row.kind === "podcast_episode") {
    return `${row.creatorName} 的播客分享`
  }

  return `${row.creatorName} 的文章分享`
}

function getPrimarySummary(row: PublicContentRow): PublicSummary {
  const zhSummary = row.summaries.find((summary) => summary.locale === "zh")

  if (zhSummary) {
    return {
      locale: "zh",
      text: zhSummary.summary,
      bullets: zhSummary.bullets,
      isFallback: false,
    }
  }

  const enSummary = row.summaries.find((summary) => summary.locale === "en")

  if (enSummary) {
    return {
      locale: "en",
      text: enSummary.summary,
      bullets: enSummary.bullets,
      isFallback: false,
    }
  }

  return {
    locale: "zh",
    text: "摘要暂未生成。",
    bullets: [],
    isFallback: true,
  }
}

function buildExcerpt(row: PublicContentRow, summary: PublicSummary) {
  const translation = getPreferredTranslation(row)
  const fallback = cleanDecodedText(
    translation?.plainText ??
      translation?.transcriptText ??
      (summary.isFallback ? undefined : summary.text) ??
      row.plainText ??
      row.transcriptText ??
      row.title ??
      row.sourceName
  )

  return truncate(fallback, 110)
}

function buildReadTime(row: PublicContentRow, category: FeedCategory) {
  const summary = getPrimarySummary(row)
  const sourceText = cleanDecodedText(
    row.transcriptText ?? row.plainText ?? row.title ?? row.sourceName
  )
  const minutes = Math.max(1, Math.ceil(sourceText.length / 420))

  if (category !== "article") {
    return `${minutes} 分钟`
  }

  return summary.isFallback ? `${minutes} 分钟阅读` : `${minutes} 分钟摘要`
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

  if (summary.locale === "zh" && !summary.isFallback) {
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
    kind: row.kind,
    category,
    cardType: category === "article" ? "digest" : "standard",
    title,
    contentUrl: row.url,
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
        duration: buildDuration(row),
        timeline: buildTimeline(row),
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
