import type { NormalizedContentKind } from "@/modules/ingest/types"

export type PublicContentSummaryRow = {
  locale: string
  summary: string
  bullets: string[]
}

export type PublicContentTranslationRow = {
  locale: string
  title?: string
  plainText?: string
  transcriptText?: string
}

export type PublicContentRow = {
  id: string
  slug: string
  kind: NormalizedContentKind
  title: string | null
  url: string
  publishedAt: string
  language?: string
  rawPayload: Record<string, unknown>
  creatorName: string
  creatorHandle?: string
  sourceName: string
  sourceUrl: string
  plainText?: string
  transcriptText?: string
  summaries: PublicContentSummaryRow[]
  translations: PublicContentTranslationRow[]
}

export interface PublicContentRepository {
  listPublishedRows(): Promise<PublicContentRow[]>
  getPublishedRowBySlug(slug: string): Promise<PublicContentRow | null>
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

function isNormalizedContentKind(value: string): value is NormalizedContentKind {
  return (
    value === "tweet" || value === "podcast_episode" || value === "blog_post"
  )
}

function parseSummaryRow(value: unknown): PublicContentSummaryRow | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const record = value as Record<string, unknown>

  if (typeof record.locale !== "string" || typeof record.summary !== "string") {
    return null
  }

  return {
    locale: record.locale,
    summary: record.summary,
    bullets: Array.isArray(record.bullets)
      ? record.bullets.filter((item): item is string => typeof item === "string")
      : [],
  }
}

function parseTranslationRow(value: unknown): PublicContentTranslationRow | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const record = value as Record<string, unknown>

  if (typeof record.locale !== "string") {
    return null
  }

  return {
    locale: record.locale,
    title: typeof record.title === "string" ? record.title : undefined,
    plainText:
      typeof record.plain_text === "string" ? record.plain_text : undefined,
    transcriptText:
      typeof record.transcript_text === "string"
        ? record.transcript_text
        : undefined,
  }
}

type QueryError = {
  message: string
} | null

type ContentItemsQueryBuilder = {
  eq(column: string, value: string): ContentItemsQueryBuilder
  order(
    column: string,
    options: {
      ascending: boolean
    }
  ): ContentItemsQueryBuilder
  limit(count: number): PromiseLike<{
    data: unknown[] | null
    error: QueryError
  }>
}

export type PublicContentClient = {
  from(table: string): {
    select(query: string): ContentItemsQueryBuilder
  }
}

type ContentItemReadRow = {
  id: string
  slug: string
  kind: string
  title?: string | null
  url: string
  published_at: string
  language?: string | null
  raw_payload?: Record<string, unknown> | null
  creators?:
    | {
        display_name?: string | null
        handle?: string | null
      }
    | Array<{
        display_name?: string | null
        handle?: string | null
      }>
    | null
  sources?:
    | {
        name?: string | null
        homepage_url?: string | null
      }
    | Array<{
        name?: string | null
        homepage_url?: string | null
      }>
    | null
  content_bodies?:
    | {
        plain_text?: string | null
        transcript_text?: string | null
      }
    | Array<{
        plain_text?: string | null
        transcript_text?: string | null
      }>
    | null
  content_summaries?:
    | {
        locale?: string | null
        summary?: string | null
        bullets?: unknown
      }
    | Array<{
        locale?: string | null
        summary?: string | null
        bullets?: unknown
      }>
    | null
  content_translations?:
    | {
        locale?: string | null
        title?: string | null
        plain_text?: string | null
        transcript_text?: string | null
      }
    | Array<{
        locale?: string | null
        title?: string | null
        plain_text?: string | null
        transcript_text?: string | null
      }>
    | null
}

const PUBLIC_CONTENT_SELECT = `
  id,
  slug,
  kind,
  title,
  url,
  published_at,
  language,
  raw_payload,
  creators(display_name, handle),
  sources(name, homepage_url),
  content_bodies(plain_text, transcript_text),
  content_summaries(locale, summary, bullets),
  content_translations(locale, title, plain_text, transcript_text)
`

const MAX_PUBLIC_ROWS = 500

function mapContentItemRow(row: ContentItemReadRow): PublicContentRow | null {
  if (!isNormalizedContentKind(row.kind)) {
    return null
  }

  const creator = firstRelation(row.creators)
  const source = firstRelation(row.sources)
  const body = firstRelation(row.content_bodies)
  const summariesRaw = Array.isArray(row.content_summaries)
    ? row.content_summaries
    : row.content_summaries
      ? [row.content_summaries]
      : []
  const summaries = summariesRaw
    .map((summary) => parseSummaryRow(summary))
    .filter((summary): summary is PublicContentSummaryRow => summary !== null)
  const translationsRaw = Array.isArray(row.content_translations)
    ? row.content_translations
    : row.content_translations
      ? [row.content_translations]
      : []
  const translations = translationsRaw
    .map((translation) => parseTranslationRow(translation))
    .filter(
      (translation): translation is PublicContentTranslationRow =>
        translation !== null
    )

  return {
    id: row.id,
    slug: row.slug,
    kind: row.kind,
    title: row.title ?? null,
    url: row.url,
    publishedAt: row.published_at,
    language: row.language ?? undefined,
    rawPayload:
      typeof row.raw_payload === "object" && row.raw_payload ? row.raw_payload : {},
    creatorName: creator?.display_name ?? source?.name ?? "Unknown creator",
    creatorHandle: creator?.handle ?? undefined,
    sourceName: source?.name ?? "Unknown source",
    sourceUrl: source?.homepage_url ?? row.url,
    plainText: body?.plain_text ?? undefined,
    transcriptText: body?.transcript_text ?? undefined,
    summaries,
    translations,
  }
}

export function createSupabasePublicContentRepository(
  client: PublicContentClient
): PublicContentRepository {
  return {
    async listPublishedRows() {
      const { data, error } = await client
        .from("content_items")
        .select(PUBLIC_CONTENT_SELECT)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(MAX_PUBLIC_ROWS)

      if (error) {
        throw new Error(`content_items select failed: ${error.message}`)
      }

      const rows = Array.isArray(data) ? (data as ContentItemReadRow[]) : []

      return rows
        .map((row) => mapContentItemRow(row))
        .filter((row): row is PublicContentRow => row !== null)
    },
    async getPublishedRowBySlug(slug: string) {
      const { data, error } = await client
        .from("content_items")
        .select(PUBLIC_CONTENT_SELECT)
        .eq("status", "published")
        .eq("slug", slug)
        .limit(1)

      if (error) {
        throw new Error(`content_items detail select failed: ${error.message}`)
      }

      const rows = Array.isArray(data) ? (data as ContentItemReadRow[]) : []
      const row = rows[0]

      return row ? mapContentItemRow(row) : null
    },
  }
}

export function createInMemoryPublicContentRepository(
  rows: PublicContentRow[]
): PublicContentRepository {
  const snapshot = [...rows]

  return {
    async listPublishedRows() {
      return [...snapshot]
    },
    async getPublishedRowBySlug(slug: string) {
      return snapshot.find((row) => row.slug === slug) ?? null
    },
  }
}
