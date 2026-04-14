import { randomUUID } from "node:crypto"

import type { NormalizedContentKind } from "@/modules/ingest/types"
import { resolveSummaryEnrichmentMode } from "@/modules/summaries/enrichment-mode"

export type SummaryLocale = "zh" | "en"

export type PendingSummaryInput = {
  contentItemId: string
  slug: string
  kind: NormalizedContentKind
  title?: string | null
  url: string
  publishedAt: string
  language?: string
  rawPayload: Record<string, unknown>
  plainText?: string
  transcriptText?: string
  creatorName: string
  creatorHandle?: string
  sourceName: string
  sourceUrl?: string
}

export type ContentSummaryRecord = {
  id: string
  contentItemId: string
  locale: SummaryLocale
  summary: string
  bullets: string[]
  model?: string
  status: "completed"
}

export type ContentTranslationRecord = {
  id: string
  contentItemId: string
  locale: SummaryLocale
  title?: string | null
  plainText?: string
  transcriptText?: string
  model?: string
  status: "completed"
}

function hasSummaryLocale(
  summaries: Array<{ locale?: string | null }>,
  locale: SummaryLocale
) {
  return summaries.some(
    (summary) =>
      summary &&
      typeof summary === "object" &&
      "locale" in summary &&
      summary.locale === locale
  )
}

function hasTranslationLocale(
  translations: Array<{ locale?: string | null }>,
  locale: SummaryLocale
) {
  return translations.some(
    (translation) =>
      translation &&
      typeof translation === "object" &&
      "locale" in translation &&
      translation.locale === locale
  )
}

export interface SummaryRepository {
  listPendingSummaryInputs(limit?: number): Promise<PendingSummaryInput[]>
  upsertSummary(
    summary: Omit<ContentSummaryRecord, "id">
  ): Promise<ContentSummaryRecord>
  upsertTranslation(
    translation: Omit<ContentTranslationRecord, "id">
  ): Promise<ContentTranslationRecord>
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

type SummaryClient = {
  from(table: string): {
    select(query: string): {
      order(
        column: string,
        options: { ascending: boolean }
      ): {
        range(from: number, to: number): PromiseLike<{
          data: unknown[] | null
          error: { message: string } | null
        }>
      }
      single(): PromiseLike<{
        data: { id?: string } | null
        error: { message: string } | null
      }>
    }
    upsert(payload: unknown, options?: unknown): {
      select(): {
        single(): PromiseLike<{
          data: { id?: string } | null
          error: { message: string } | null
        }>
      }
    }
  }
}

type SummaryIndexRow = {
  id: string
  slug: string
  kind: NormalizedContentKind
  title?: string | null
  url: string
  published_at: string
  language?: string | null
  raw_payload?: Record<string, unknown> | null
  creators?:
    | {
        display_name?: string | null
        handle?: string | null
        profile_url?: string | null
      }
    | Array<{
        display_name?: string | null
        handle?: string | null
        profile_url?: string | null
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
      }
    | Array<{
        locale?: string | null
      }>
    | null
  content_translations?:
    | {
        locale?: string | null
      }
    | Array<{
        locale?: string | null
      }>
    | null
}

const SUMMARY_SCAN_PAGE_SIZE = 200
const SUMMARY_SCAN_MAX_PAGES = 50

function hasPendingEnrichment(row: SummaryIndexRow) {
  const summaries = Array.isArray(row.content_summaries)
    ? row.content_summaries
    : row.content_summaries
      ? [row.content_summaries]
      : []
  const translations = Array.isArray(row.content_translations)
    ? row.content_translations
    : row.content_translations
      ? [row.content_translations]
      : []
  const body = firstRelation(row.content_bodies)
  const mode = resolveSummaryEnrichmentMode({
    kind: row.kind,
    rawPayload:
      typeof row.raw_payload === "object" && row.raw_payload ? row.raw_payload : {},
    plainText: body?.plain_text ?? undefined,
    transcriptText: body?.transcript_text ?? undefined,
  })

  return (
    !hasSummaryLocale(summaries, "zh") ||
    !hasTranslationLocale(translations, "zh") ||
    (mode === "deep" && !hasSummaryLocale(summaries, "en"))
  )
}

function mapPendingSummaryInput(row: SummaryIndexRow): PendingSummaryInput {
  const creator = firstRelation(row.creators)
  const source = firstRelation(row.sources)
  const body = firstRelation(row.content_bodies)

  return {
    contentItemId: row.id,
    slug: row.slug,
    kind: row.kind,
    title: row.title,
    url: row.url,
    publishedAt: row.published_at,
    language: row.language ?? undefined,
    rawPayload:
      typeof row.raw_payload === "object" && row.raw_payload ? row.raw_payload : {},
    plainText: body?.plain_text ?? undefined,
    transcriptText: body?.transcript_text ?? undefined,
    creatorName: creator?.display_name ?? source?.name ?? "Unknown creator",
    creatorHandle: creator?.handle ?? undefined,
    sourceName: source?.name ?? "Unknown source",
    sourceUrl: source?.homepage_url ?? undefined,
  } satisfies PendingSummaryInput
}

export function createSupabaseSummaryRepository(
  client: SummaryClient
): SummaryRepository {
  return {
    async listPendingSummaryInputs(limit = 20) {
      const query = client
        .from("content_items")
        .select(`
          id,
          slug,
          kind,
          title,
          url,
          published_at,
          language,
          raw_payload,
          creators(display_name, handle, profile_url),
          sources(name, homepage_url),
          content_bodies(plain_text, transcript_text),
          content_summaries(locale),
          content_translations(locale)
        `)
        .order("published_at", { ascending: true })
      const pending: PendingSummaryInput[] = []

      for (let page = 0; page < SUMMARY_SCAN_MAX_PAGES; page += 1) {
        const from = page * SUMMARY_SCAN_PAGE_SIZE
        const to = from + SUMMARY_SCAN_PAGE_SIZE - 1
        const { data, error } = await query.range(from, to)

        if (error) {
          throw new Error(`content_items select failed: ${error.message}`)
        }

        const rows = Array.isArray(data) ? (data as SummaryIndexRow[]) : []

        for (const row of rows) {
          if (!hasPendingEnrichment(row)) {
            continue
          }

          pending.push(mapPendingSummaryInput(row))

          if (pending.length >= limit) {
            return pending
          }
        }

        if (rows.length < SUMMARY_SCAN_PAGE_SIZE) {
          break
        }
      }

      return pending
    },
    async upsertSummary(summary) {
      const { data, error } = await client
        .from("content_summaries")
        .upsert(
          {
            content_item_id: summary.contentItemId,
            locale: summary.locale,
            summary: summary.summary,
            bullets: summary.bullets,
            model: summary.model ?? null,
            status: summary.status,
          },
          { onConflict: "content_item_id,locale" }
        )
        .select()
        .single()

      if (error) {
        throw new Error(`content_summaries upsert failed: ${error.message}`)
      }

      return {
        id: data?.id ?? randomUUID(),
        ...summary,
      } satisfies ContentSummaryRecord
    },
    async upsertTranslation(translation) {
      const { data, error } = await client
        .from("content_translations")
        .upsert(
          {
            content_item_id: translation.contentItemId,
            locale: translation.locale,
            title: translation.title ?? null,
            plain_text: translation.plainText ?? null,
            transcript_text: translation.transcriptText ?? null,
            model: translation.model ?? null,
            status: translation.status,
          },
          { onConflict: "content_item_id,locale" }
        )
        .select()
        .single()

      if (error) {
        throw new Error(`content_translations upsert failed: ${error.message}`)
      }

      return {
        id: data?.id ?? randomUUID(),
        ...translation,
      } satisfies ContentTranslationRecord
    },
  }
}

export function createInMemorySummaryRepository(
  inputs: PendingSummaryInput[] = []
): SummaryRepository & {
  snapshot(): {
    summaries: ContentSummaryRecord[]
    translations: ContentTranslationRecord[]
  }
} {
  const pending = [...inputs]
  const summaries: ContentSummaryRecord[] = []
  const translations: ContentTranslationRecord[] = []

  return {
    async listPendingSummaryInputs(limit = 20) {
      return [...pending]
        .sort((left, right) =>
          left.publishedAt === right.publishedAt
            ? left.slug.localeCompare(right.slug)
            : left.publishedAt.localeCompare(right.publishedAt)
        )
        .filter(
          (input) => {
            const mode = resolveSummaryEnrichmentMode(input)

            return (
              !summaries.some(
                (summary) =>
                  summary.contentItemId === input.contentItemId &&
                  summary.locale === "zh"
              ) ||
              !translations.some(
                (translation) =>
                  translation.contentItemId === input.contentItemId &&
                  translation.locale === "zh"
              ) ||
              (mode === "deep" &&
                !summaries.some(
                  (summary) =>
                    summary.contentItemId === input.contentItemId &&
                    summary.locale === "en"
                ))
            )
          }
        )
        .slice(0, limit)
    },
    async upsertSummary(summary) {
      const existing = summaries.find(
        (item) =>
          item.contentItemId === summary.contentItemId &&
          item.locale === summary.locale
      )

      if (existing) {
        Object.assign(existing, summary)
        return existing
      }

      const next: ContentSummaryRecord = {
        id: randomUUID(),
        ...summary,
      }
      summaries.push(next)
      return next
    },
    async upsertTranslation(translation) {
      const existing = translations.find(
        (item) =>
          item.contentItemId === translation.contentItemId &&
          item.locale === translation.locale
      )

      if (existing) {
        Object.assign(existing, translation)
        return existing
      }

      const next: ContentTranslationRecord = {
        id: randomUUID(),
        ...translation,
      }
      translations.push(next)
      return next
    },
    snapshot() {
      return {
        summaries: [...summaries],
        translations: [...translations],
      }
    },
  }
}
