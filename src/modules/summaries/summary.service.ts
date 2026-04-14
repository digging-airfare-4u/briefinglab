import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import type { NormalizedContentKind } from "@/modules/ingest/types"
import { resolveSummaryEnrichmentMode } from "@/modules/summaries/enrichment-mode"
import type {
  ContentSummaryRecord,
  ContentTranslationRecord,
  PendingSummaryInput,
  SummaryRepository,
} from "@/modules/summaries/summary.repository"

export type GeneratedSummary = Omit<ContentSummaryRecord, "id" | "contentItemId">
export type GeneratedTranslation = Omit<
  ContentTranslationRecord,
  "id" | "contentItemId"
>
export type GeneratedEnrichment = {
  summaries: GeneratedSummary[]
  translations: GeneratedTranslation[]
}

export type SummaryGenerator = {
  generate(input: PendingSummaryInput): Promise<GeneratedEnrichment>
}

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function getPromptFilename(kind: NormalizedContentKind) {
  switch (kind) {
    case "tweet":
      return "summarize-tweets.md"
    case "podcast_episode":
      return "summarize-podcast.md"
    case "blog_post":
      return "summarize-blogs.md"
  }
}

const promptCache = new Map<NormalizedContentKind, string>()

function loadPrompt(kind: NormalizedContentKind) {
  const cached = promptCache.get(kind)

  if (cached) {
    return cached
  }

  const prompt = readFileSync(
    resolve(
      process.cwd(),
      "src/modules/summaries/prompts",
      getPromptFilename(kind)
    ),
    "utf8"
  )
  promptCache.set(kind, prompt)
  return prompt
}

function getFallbackText(input: PendingSummaryInput) {
  const rawRecord = input.rawPayload
  const rawCandidates = [
    input.transcriptText,
    input.plainText,
    typeof rawRecord.text === "string" ? rawRecord.text : undefined,
    typeof rawRecord.description === "string" ? rawRecord.description : undefined,
    typeof rawRecord.content === "string" ? rawRecord.content : undefined,
    typeof rawRecord.html === "string" ? rawRecord.html : undefined,
    input.title ?? undefined,
  ]

  return rawCandidates.find(
    (candidate) => typeof candidate === "string" && cleanText(candidate).length > 0
  )
}

function extractFragments(input: PendingSummaryInput) {
  const sourceText = getFallbackText(input)

  if (!sourceText) {
    return []
  }

  return cleanText(sourceText)
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map(cleanText)
    .filter(Boolean)
    .slice(0, 6)
}

function getKindLabel(kind: NormalizedContentKind) {
  switch (kind) {
    case "tweet":
      return "动态"
    case "podcast_episode":
      return "播客"
    case "blog_post":
      return "文章"
  }
}

function buildEnglishSummary(input: PendingSummaryInput, fragments: string[]) {
  const lead =
    fragments[0] ??
    input.title ??
    `Source update from ${input.creatorName} at ${input.sourceName}.`
  const detail = fragments[1]
  const summary = truncate(
    [lead, detail].filter(Boolean).join(" "),
    220
  )
  const bullets =
    fragments.slice(0, 3).map((fragment) => truncate(fragment, 120)) ||
    [`Original source: ${input.url}`]

  return {
    locale: "en" as const,
    summary,
    bullets: bullets.length > 0 ? bullets : [`Original source: ${input.url}`],
  }
}

function buildChineseSummary(input: PendingSummaryInput, fragments: string[]) {
  const lead = fragments[0] ?? input.title ?? "当前仅有来源元数据，正文待补充。"
  const titlePart = input.title ? `《${truncate(input.title, 32)}》` : "这条内容"
  const kindLabel = getKindLabel(input.kind)
  const summary = truncate(
    `${input.creatorName} 发布的${kindLabel}${titlePart}主要围绕：${lead}`,
    180
  )
  const bullets = fragments.length
    ? fragments.slice(0, 3).map((fragment, index) =>
        truncate(`重点 ${index + 1}：${fragment}`, 120)
      )
    : [
        `来源：${input.sourceName}`,
        `作者：${input.creatorName}`,
        `原文：${truncate(input.url, 96)}`,
      ]

  return {
    locale: "zh" as const,
    summary,
    bullets,
  }
}

export function createHeuristicSummaryGenerator(): SummaryGenerator {
  return {
    async generate(input) {
      const fragments = extractFragments(input)
      const prompt = loadPrompt(input.kind)
      const model = `heuristic:${getPromptFilename(input.kind)}:${prompt.length}`
      const mode = resolveSummaryEnrichmentMode(input)
      const summaries =
        mode === "compact"
          ? [
              {
                ...buildChineseSummary(input, fragments),
                model,
                status: "completed" as const,
              },
            ]
          : [
              {
                ...buildEnglishSummary(input, fragments),
                model,
                status: "completed" as const,
              },
              {
                ...buildChineseSummary(input, fragments),
                model,
                status: "completed" as const,
              },
            ]

      return {
        summaries,
        translations: [],
      }
    },
  }
}

export class SummaryService {
  constructor(
    private readonly repository: SummaryRepository,
    private readonly generator: SummaryGenerator = createHeuristicSummaryGenerator()
  ) {}

  async runPending({ limit = 20 }: { limit?: number } = {}) {
    const inputs = await this.repository.listPendingSummaryInputs(limit)
    let created = 0
    let failed = 0
    const errors: Array<{ contentItemId: string; message: string }> = []

    for (const input of inputs) {
      try {
        await this.repository.markEnrichmentAttempted(input.contentItemId)
        const generated = await this.generator.generate(input)

        for (const summary of generated.summaries) {
          await this.repository.upsertSummary({
            contentItemId: input.contentItemId,
            ...summary,
          })
          created += 1
        }

        for (const translation of generated.translations) {
          await this.repository.upsertTranslation({
            contentItemId: input.contentItemId,
            ...translation,
          })
          created += 1
        }

        await this.repository.markEnrichmentResult(input.contentItemId, null)
      } catch (error) {
        failed += 1
        const message = error instanceof Error ? error.message : String(error)
        errors.push({
          contentItemId: input.contentItemId,
          message,
        })
        try {
          await this.repository.markEnrichmentResult(input.contentItemId, message)
        } catch {
          // ignore follow-up errors when marking result
        }
      }
    }

    return {
      processed: inputs.length,
      created,
      failed,
      errors,
    }
  }
}
