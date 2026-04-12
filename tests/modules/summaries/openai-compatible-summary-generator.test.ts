import { describe, expect, it, vi } from "vitest"

import type { PendingSummaryInput } from "@/modules/summaries/summary.repository"

function makePendingInput(
  overrides: Partial<PendingSummaryInput> = {}
): PendingSummaryInput {
  return {
    contentItemId: "content-1",
    slug: "blog-1",
    kind: "blog_post",
    title: "Why execution loops matter",
    url: "https://example.com/blog-1",
    publishedAt: "2026-04-06T08:10:00.000Z",
    rawPayload: {},
    plainText:
      "Execution loops make agent products more reliable because they can resume, inspect state, and continue from partial work.",
    creatorName: "Latent Space",
    creatorHandle: "latentspace",
    sourceName: "Latent Space",
    sourceUrl: "https://example.com",
    ...overrides,
  }
}

describe("openai compatible summary generator", () => {
  it("parses bilingual summaries and translated body from a chat completions response", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary_en:
                    "Execution loops improve reliability by making partial work resumable.",
                  bullets_en: ["Resume partial work", "Inspect state"],
                  summary_zh:
                    "执行回路通过让未完成工作可恢复来提升可靠性。",
                  bullets_zh: ["恢复部分工作", "检查中间状态"],
                  title_zh: "为什么执行回路很重要",
                  plain_text_zh:
                    "执行回路会让 agent 产品更可靠，因为它们可以恢复、检查状态并继续执行未完成的工作。",
                }),
              },
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }
      )
    )

    const { createOpenAICompatibleSummaryGenerator } = await import(
      "@/modules/summaries/openai-compatible-summary-generator"
    )
    const generator = createOpenAICompatibleSummaryGenerator(
      {
        baseUrl: "https://example.com/v1",
        apiKey: "test-key",
        model: "test-model",
      },
      fetchImpl as typeof fetch
    )

    const result = await generator.generate(
      makePendingInput({
        plainText: `Execution loops improve reliability by letting systems resume partial work, inspect intermediate state, continue across multiple execution steps, coordinate across tools, and preserve work between retries.

They are especially useful for longer engineering tasks where a single pass is not enough and the system needs checkpoints, retries, explicit continuation logic, operator review, and durable state between separate tool calls.

In practice, they turn agent systems from one-shot demos into workflows that can survive interruption, expose intermediate artifacts, and keep making progress over time.`,
      })
    )

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(result.summaries.map((item) => item.locale).sort()).toEqual([
      "en",
      "zh",
    ])
    expect(result.translations[0]?.locale).toBe("zh")
    expect(result.translations[0]?.title).toBe("为什么执行回路很重要")
    expect(result.translations[0]?.plainText).toContain("agent 产品")
  })

  it("strips think blocks and requests json output from compatible providers", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: `<think>internal reasoning</think>
{
  "summary_en": "A short English summary.",
  "bullets_en": ["Point A", "Point B"],
  "summary_zh": "一段简短的中文摘要。",
  "bullets_zh": ["重点 A", "重点 B"],
  "title_zh": "中文标题",
  "plain_text_zh": "中文译文正文。"
}`,
              },
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }
      )
    )

    const { createOpenAICompatibleSummaryGenerator } = await import(
      "@/modules/summaries/openai-compatible-summary-generator"
    )
    const generator = createOpenAICompatibleSummaryGenerator(
      {
        baseUrl: "https://example.com/v1",
        apiKey: "test-key",
        model: "test-model",
      },
      fetchImpl as typeof fetch
    )

    const result = await generator.generate(
      makePendingInput({
        plainText: `Execution loops make agent products more reliable because they can resume, inspect state, continue from partial work, coordinate across tools, and keep longer-running jobs observable.

They also make it possible to checkpoint complex workflows, recover from intermittent failures, and hand work across multiple steps without losing context.`,
      })
    )
    const calls = (fetchImpl as unknown as { mock: { calls: Array<unknown[]> } }).mock
      .calls
    const request = calls[0]?.[1] as RequestInit | undefined
    const payload = JSON.parse(String(request?.body))

    expect(result.summaries.find((item) => item.locale === "en")?.summary).toContain(
      "English"
    )
    expect(result.translations[0]?.plainText).toContain("中文译文")
    expect(payload.response_format).toEqual({ type: "json_object" })
  })

  it("uses compact enrichment for short content and only requires Chinese summary plus translation", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary_zh: "Codex 现在支持更长时间运行的工程任务。",
                  bullets_zh: [],
                  title_zh: "Codex 现在支持更长时间运行的工程任务",
                  plain_text_zh:
                    "Codex 现在支持更长时间运行的工程任务和更深的执行回路。",
                }),
              },
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }
      )
    )

    const { createOpenAICompatibleSummaryGenerator } = await import(
      "@/modules/summaries/openai-compatible-summary-generator"
    )
    const generator = createOpenAICompatibleSummaryGenerator(
      {
        baseUrl: "https://example.com/v1",
        apiKey: "test-key",
        model: "test-model",
      },
      fetchImpl as typeof fetch
    )

    const result = await generator.generate(
      makePendingInput({
        kind: "tweet",
        title: null,
        plainText:
          "Codex now supports longer-running engineering tasks & deeper loops.",
        rawPayload: {
          text: "Codex now supports longer-running engineering tasks & deeper loops.",
        },
      })
    )
    const calls = (fetchImpl as unknown as { mock: { calls: Array<unknown[]> } }).mock
      .calls
    const request = calls[0]?.[1] as RequestInit | undefined
    const payload = JSON.parse(String(request?.body))
    const prompt = payload.messages?.[1]?.content as string

    expect(result.summaries.map((item) => item.locale)).toEqual(["zh"])
    expect(result.translations[0]?.plainText).toContain("更深的执行回路")
    expect(prompt).toContain("enrichment_mode: compact")
    expect(prompt).not.toContain(
      "Required JSON keys: summary_en, bullets_en, summary_zh"
    )
    expect(prompt).not.toContain(
      "- summary_en and summary_zh must be concise but informative."
    )
  })
})
