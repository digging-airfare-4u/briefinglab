import { randomUUID } from "node:crypto"

export type DailySummaryRecord = {
  id: string
  date: string
  locale: string
  summary: string
  bullets: string[]
  highlights: string[]
  model?: string
  status: string
  generatedAt: string
}

export type DailySummaryInput = {
  date: string
  locale: string
  summary: string
  bullets: string[]
  highlights?: string[]
  model?: string
  status: string
}

export interface DailySummaryRepository {
  listByDates(dates: string[]): Promise<DailySummaryRecord[]>
  listMissingDates(limit?: number): Promise<string[]>
  upsert(input: DailySummaryInput): Promise<DailySummaryRecord>
}

type DailySummaryRow = {
  id: string
  date: string
  locale: string
  summary: string
  bullets: unknown
  highlights: unknown
  model?: string | null
  status: string
  generated_at: string
}

type QueryError = { message: string } | null

type DailySummaryClient = {
  from(table: string): {
    select(query: string): {
      in(column: string, values: string[]): PromiseLike<{
        data: unknown[] | null
        error: QueryError
      }>
      order(column: string, options: { ascending: boolean }): {
        limit(count: number): PromiseLike<{
          data: unknown[] | null
          error: QueryError
        }>
      }
    }
    upsert(payload: unknown, options?: unknown): {
      select(): {
        single(): PromiseLike<{
          data: { id?: string } | null
          error: QueryError
        }>
      }
    }
  }
}

function parseRow(row: unknown): DailySummaryRecord | null {
  if (!row || typeof row !== "object") return null
  const r = row as Record<string, unknown>
  if (typeof r.summary !== "string" || typeof r.date !== "string") return null

  const bullets = Array.isArray(r.bullets)
    ? r.bullets.filter((item): item is string => typeof item === "string")
    : []
  const highlights = Array.isArray(r.highlights)
    ? r.highlights.filter((item): item is string => typeof item === "string")
    : []

  return {
    id: typeof r.id === "string" ? r.id : randomUUID(),
    date: r.date,
    locale: typeof r.locale === "string" ? r.locale : "zh",
    summary: r.summary,
    bullets,
    highlights,
    model: typeof r.model === "string" ? r.model : undefined,
    status: typeof r.status === "string" ? r.status : "completed",
    generatedAt: typeof r.generated_at === "string" ? r.generated_at : new Date().toISOString(),
  }
}

export function createSupabaseDailySummaryRepository(
  client: DailySummaryClient
): DailySummaryRepository {
  return {
    async listByDates(dates) {
      if (dates.length === 0) return []
      const { data, error } = await client
        .from("daily_summaries")
        .select("id, date, locale, summary, bullets, highlights, model, status, generated_at")
        .in("date", dates)

      if (error) {
        throw new Error(`daily_summaries select failed: ${error.message}`)
      }

      const rows = Array.isArray(data) ? (data as DailySummaryRow[]) : []
      return rows.map(parseRow).filter((r): r is DailySummaryRecord => r !== null)
    },

    async listMissingDates(limit = 30) {
      const { data, error } = await client
        .from("daily_summaries")
        .select("date")
        .order("date", { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`daily_summaries listMissingDates failed: ${error.message}`)
      }

      const rows = Array.isArray(data) ? (data as { date: string }[]) : []
      const existing = new Set(rows.map((r) => r.date))
      const missing: string[] = []
      const today = new Date()

      for (let i = 0; i < limit; i += 1) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().slice(0, 10)
        if (!existing.has(dateStr)) {
          missing.push(dateStr)
        }
      }

      return missing
    },

    async upsert(input) {
      const { data, error } = await client
        .from("daily_summaries")
        .upsert(
          {
            date: input.date,
            locale: input.locale,
            summary: input.summary,
            bullets: input.bullets,
            highlights: input.highlights ?? [],
            model: input.model ?? null,
            status: input.status,
          },
          { onConflict: "date" }
        )
        .select()
        .single()

      if (error) {
        throw new Error(`daily_summaries upsert failed: ${error.message}`)
      }

      const parsed = parseRow(data)
      if (!parsed) {
        throw new Error("daily_summaries upsert returned invalid row")
      }

      return parsed
    },
  }
}
