import type { OptionalLlmEnv } from "@/config/env"

export type DailySummaryPayload = {
  summary: string
  bullets: string[]
  highlights: string[]
}

export type DailySummaryGenerator = {
  generate(date: string, items: DailySummaryItem[]): Promise<DailySummaryPayload>
}

export type DailySummaryItem = {
  title: string
  sourceName: string
  creatorName: string
  category: "news" | "article"
  summary?: string
  bullets?: string[]
}

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`
}

function buildPrompt(date: string, items: DailySummaryItem[]) {
  const lines = [
    "You are an editor that writes a concise daily briefing in Simplified Chinese.",
    "Return JSON only. Do not wrap the JSON in markdown.",
    "Required JSON keys: summary, bullets, highlights.",
    "Rules:",
    "- summary: a 100-180 character overview of the day's AI news and articles. Warm, journalistic tone.",
    "- bullets: 2-4 short bullet points summarizing major themes or trends across the day.",
    "- highlights: 2-3 one-sentence highlights of the most notable individual items. Write complete sentences; do not end with '...' or '…'.",
    "- All output must be in Simplified Chinese.",
    "- Keep facts faithful. Do not invent information.",
    `date: ${date}`,
    "",
    "items:",
  ]

  for (const item of items) {
    const categoryLabel = item.category === "news" ? "动态" : "文章"
    const body = truncate(item.summary ?? item.title, 120)
    lines.push(`- [${categoryLabel}] ${item.title} (${item.sourceName} / ${item.creatorName}): ${body}`)
  }

  return lines.join("\n")
}

type ChatCompletionsResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>
    }
  }>
  error?: { message?: string }
}

function extractMessageContent(payload: ChatCompletionsResponse) {
  const content = payload.choices?.[0]?.message?.content
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    return content.map((part) => (typeof part?.text === "string" ? part.text : "")).join("\n")
  }
  return null
}

function stripCodeFence(value: string) {
  const trimmed = value.trim()
  if (!trimmed.startsWith("```")) return trimmed
  return trimmed.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim()
}

function stripThinkBlock(value: string) {
  return value.replace(/^<think>[\s\S]*?<\/think>\s*/i, "").trim()
}

function extractJsonBlock(value: string) {
  const start = value.indexOf("{")
  const end = value.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) return value
  return value.slice(start, end + 1)
}

function parseJsonPayload(content: string): unknown {
  return JSON.parse(extractJsonBlock(stripThinkBlock(stripCodeFence(content))))
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => stripTrailingEllipsis(item))
    : []
}

function stripTrailingEllipsis(value: string) {
  return value.replace(/[.]{3}$/, "").replace(/…$/, "").trim()
}

function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing or invalid field from LLM response: ${field}`)
  }
  return stripTrailingEllipsis(value.trim())
}

export function createOpenAICompatibleDailySummaryGenerator(
  config: OptionalLlmEnv,
  fetchImpl: typeof fetch = fetch
): DailySummaryGenerator {
  return {
    async generate(date, items) {
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
            temperature: 0.3,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "You generate concise daily briefings in Simplified Chinese for an AI editorial digest.",
              },
              {
                role: "user",
                content: buildPrompt(date, items),
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
          errorPayload?.error?.message ?? `LLM request failed with status ${response.status}`
        )
      }

      const payload = (await response.json()) as ChatCompletionsResponse
      const content = extractMessageContent(payload)

      if (!content) {
        throw new Error("LLM response did not include message content")
      }

      const parsed = parseJsonPayload(content) as Record<string, unknown>

      return {
        summary: requireString(parsed.summary, "summary"),
        bullets: asStringArray(parsed.bullets),
        highlights: asStringArray(parsed.highlights),
      }
    },
  }
}

export function createHeuristicDailySummaryGenerator(): DailySummaryGenerator {
  return {
    async generate(date, items) {
      const articles = items.filter((i) => i.category === "article").length
      const news = items.filter((i) => i.category === "news").length
      const highlights = items.slice(0, 3).map((i) => `${i.sourceName} 发布了 ${i.title}`)

      return {
        summary: `${date} 共收录 ${articles + news} 条内容，其中文章 ${articles} 篇，动态 ${news} 条。`,
        bullets: [
          "今日内容涵盖 AI 领域的最新动态与深度文章",
          articles > 0 ? "有值得一读的长文推荐" : "以短动态和快讯为主",
        ],
        highlights: highlights.length > 0 ? highlights : ["今日无特别推荐"],
      }
    },
  }
}
