import type { OptionalLlmEnv } from "@/config/env"
import {
  resolveSummaryEnrichmentMode,
  type SummaryEnrichmentMode,
} from "@/modules/summaries/enrichment-mode"
import type { PendingSummaryInput } from "@/modules/summaries/summary.repository"
import type {
  GeneratedEnrichment,
  GeneratedSummary,
  GeneratedTranslation,
  SummaryGenerator,
} from "@/modules/summaries/summary.service"

type ChatCompletionsResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>
    }
  }>
  error?: {
    message?: string
  }
}

type GeneratedPayload = {
  summary_en?: unknown
  bullets_en?: unknown
  summary_zh?: unknown
  bullets_zh?: unknown
  title_zh?: unknown
  plain_text_zh?: unknown
  transcript_text_zh?: unknown
  translated_text_zh?: unknown
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`
}

function extractSourceText(input: PendingSummaryInput) {
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

  return cleanText(
    rawCandidates.find(
      (candidate) => typeof candidate === "string" && cleanText(candidate).length > 0
    ) ?? ""
  )
}

function extractMessageContent(payload: ChatCompletionsResponse) {
  const content = payload.choices?.[0]?.message?.content

  if (typeof content === "string") {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
  }

  return null
}

function stripCodeFence(value: string) {
  const trimmed = value.trim()

  if (!trimmed.startsWith("```")) {
    return trimmed
  }

  return trimmed
    .replace(/^```[a-zA-Z]*\n?/, "")
    .replace(/\n?```$/, "")
    .trim()
}

function stripThinkBlock(value: string) {
  return value.replace(/^<think>[\s\S]*?<\/think>\s*/i, "").trim()
}

function extractJsonBlock(value: string) {
  const start = value.indexOf("{")
  const end = value.lastIndexOf("}")

  if (start === -1 || end === -1 || end <= start) {
    return value
  }

  return value.slice(start, end + 1)
}

function parseJsonPayload(content: string): GeneratedPayload {
  return JSON.parse(
    extractJsonBlock(stripThinkBlock(stripCodeFence(content)))
  ) as GeneratedPayload
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && cleanText(item).length > 0)
    : []
}

function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || cleanText(value).length === 0) {
    throw new Error(`Missing or invalid field from LLM response: ${field}`)
  }

  return cleanText(value)
}

function buildSummaries(
  parsed: GeneratedPayload,
  model: string,
  mode: SummaryEnrichmentMode
): GeneratedSummary[] {
  const summaries: GeneratedSummary[] = [
    {
      locale: "zh",
      summary: requireString(parsed.summary_zh, "summary_zh"),
      bullets: asStringArray(parsed.bullets_zh),
      model,
      status: "completed",
    },
  ]

  if (mode === "deep") {
    summaries.unshift({
      locale: "en",
      summary: requireString(parsed.summary_en, "summary_en"),
      bullets: asStringArray(parsed.bullets_en),
      model,
      status: "completed",
    })
  }

  return summaries
}

function buildTranslations(
  input: PendingSummaryInput,
  parsed: GeneratedPayload,
  model: string
): GeneratedTranslation[] {
  const translatedPlainText =
    typeof parsed.plain_text_zh === "string"
      ? parsed.plain_text_zh.trim()
      : typeof parsed.translated_text_zh === "string"
        ? parsed.translated_text_zh.trim()
        : undefined
  const translatedTranscriptText =
    typeof parsed.transcript_text_zh === "string"
      ? parsed.transcript_text_zh.trim()
      : undefined
  const translatedTitle =
    typeof parsed.title_zh === "string" && cleanText(parsed.title_zh).length > 0
      ? cleanText(parsed.title_zh)
      : undefined

  const hasTranslationContent =
    Boolean(translatedTitle) ||
    Boolean(translatedPlainText) ||
    Boolean(translatedTranscriptText)

  if (!hasTranslationContent) {
    return []
  }

  return [
    {
      locale: "zh",
      title: translatedTitle,
      plainText: translatedPlainText,
      transcriptText: translatedTranscriptText,
      model,
      status: "completed",
    },
  ]
}

function buildPrompt(input: PendingSummaryInput, mode: SummaryEnrichmentMode) {
  const sourceText = extractSourceText(input)
  const sourceKind =
    input.kind === "tweet"
      ? "tweet"
      : input.kind === "podcast_episode"
        ? "podcast episode"
        : "blog post"

  return [
    "You are an editor that produces bilingual summaries and Chinese translations.",
    "Return JSON only. Do not wrap the JSON in markdown.",
    `enrichment_mode: ${mode}`,
    mode === "compact"
      ? "Required JSON keys: summary_zh, bullets_zh, title_zh, plain_text_zh, transcript_text_zh."
      : "Required JSON keys: summary_en, bullets_en, summary_zh, bullets_zh, title_zh, plain_text_zh, transcript_text_zh.",
    "Rules:",
    ...(mode === "compact"
      ? [
          "- summary_zh must be concise and faithful to the source.",
          "- bullets_zh may contain 0 to 2 short bullet points. Use an empty array when extra decomposition is unnecessary.",
          "- Do not return summary_en or bullets_en unless they are explicitly requested.",
        ]
      : [
          "- summary_en and summary_zh must be concise but informative.",
          "- bullets_en and bullets_zh should each contain 2 to 4 short bullet points.",
        ]),
    "- title_zh should be a natural Simplified Chinese translation when a title exists.",
    "- If transcript text exists, put the Chinese full translation into transcript_text_zh.",
    "- Otherwise put the Chinese full translation into plain_text_zh.",
    "- Keep facts faithful to the source. Do not invent information.",
    "",
    `kind: ${sourceKind}`,
    `title: ${input.title ?? ""}`,
    `url: ${input.url}`,
    `creator: ${input.creatorName}`,
    `source: ${input.sourceName}`,
    `language: ${input.language ?? "en"}`,
    "",
    "source_text:",
    truncate(sourceText, 16000),
  ].join("\n")
}

export function createOpenAICompatibleSummaryGenerator(
  config: OptionalLlmEnv,
  fetchImpl: typeof fetch = fetch
): SummaryGenerator {
  return {
    async generate(input: PendingSummaryInput): Promise<GeneratedEnrichment> {
      const mode = resolveSummaryEnrichmentMode(input)
      const response = await fetchImpl(
        `${config.baseUrl.replace(/\/$/, "")}/chat/completions`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            temperature: 0.2,
            response_format: {
              type: "json_object",
            },
            messages: [
              {
                role: "system",
                content:
                  "You generate bilingual summaries and Simplified Chinese translations for editorial content.",
              },
              {
                role: "user",
                content: buildPrompt(input, mode),
              },
            ],
          }),
        }
      )

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as
          | ChatCompletionsResponse
          | null
        throw new Error(
          errorPayload?.error?.message ??
            `LLM request failed with status ${response.status}`
        )
      }

      const payload = (await response.json()) as ChatCompletionsResponse
      const content = extractMessageContent(payload)

      if (!content) {
        throw new Error("LLM response did not include message content")
      }

      const parsed = parseJsonPayload(content)

      return {
        summaries: buildSummaries(parsed, config.model, mode),
        translations: buildTranslations(input, parsed, config.model),
      }
    },
  }
}
