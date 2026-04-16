import { getOptionalLlmEnv } from "@/config/env"
import type { PublicFeedItem } from "@/modules/content/public-content.service"
import {
  createHeuristicDailySummaryGenerator,
  createOpenAICompatibleDailySummaryGenerator,
  type DailySummaryGenerator,
  type DailySummaryItem,
} from "@/modules/summaries/daily-summary.service"
import type {
  DailySummaryInput,
  DailySummaryRepository,
} from "@/modules/summaries/daily-summary.repository"

type DailySummaryJobResult = {
  processed: number
  created: number
  failed: number
  errors: Array<{ date: string; message: string }>
}

export function mapFeedItemsToDailySummaryItems(
  items: PublicFeedItem[]
): DailySummaryItem[] {
  return items.map((item) => ({
    title: item.title ?? "",
    sourceName: item.source.name,
    creatorName: item.creator.name,
    category: item.category,
    summary: item.summary.isFallback ? undefined : item.summary.text,
    bullets: item.summary.isFallback ? undefined : item.summary.bullets,
  }))
}

function createDefaultGenerator(): {
  generator: DailySummaryGenerator
  warnings: string[]
} {
  const llmEnv = getOptionalLlmEnv()
  const fallback = createHeuristicDailySummaryGenerator()
  const warnings: string[] = []

  if (!llmEnv) {
    warnings.push(
      "LLM configuration missing; daily summary jobs will fall back to heuristic summaries."
    )
    return { generator: fallback, warnings }
  }

  const primary = createOpenAICompatibleDailySummaryGenerator(llmEnv)

  return {
    warnings,
    generator: {
      async generate(date, items) {
        try {
          return await primary.generate(date, items)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          warnings.push(
            `LLM enrichment failed for ${date}, falling back to heuristic summaries: ${message}`
          )
          return fallback.generate(date, items)
        }
      },
    },
  }
}

export async function runDailySummaryJobs({
  itemsByDate,
  repository,
  generator,
  dates,
}: {
  itemsByDate: Record<string, PublicFeedItem[]>
  repository: DailySummaryRepository
  generator?: DailySummaryGenerator
  dates?: string[]
}): Promise<DailySummaryJobResult & { warnings: string[] }> {
  const defaultGenerator = generator ? null : createDefaultGenerator()
  const gen = generator ?? defaultGenerator?.generator ?? createHeuristicDailySummaryGenerator()
  const targetDates =
    dates ?? (await repository.listMissingDates(30)).filter((d) => itemsByDate[d]?.length > 0)

  const createdInputs: DailySummaryInput[] = []
  const errors: Array<{ date: string; message: string }> = []

  for (const date of targetDates) {
    const items = itemsByDate[date]
    if (!items || items.length === 0) continue

    try {
      const payload = await gen.generate(
        date,
        mapFeedItemsToDailySummaryItems(items)
      )

      createdInputs.push({
        date,
        locale: "zh",
        summary: payload.summary,
        bullets: payload.bullets,
        highlights: payload.highlights,
        model:
          defaultGenerator && !defaultGenerator.warnings.length
            ? getOptionalLlmEnv()?.model
            : undefined,
        status: "completed",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push({ date, message })
    }
  }

  let created = 0
  for (const input of createdInputs) {
    try {
      await repository.upsert(input)
      created += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push({ date: input.date, message })
    }
  }

  return {
    processed: targetDates.length,
    created,
    failed: errors.length,
    errors,
    warnings: defaultGenerator?.warnings ?? [],
  }
}
