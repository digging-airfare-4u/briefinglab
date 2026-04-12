import { describe, expect, it, vi } from "vitest"

import {
  createInMemorySummaryRepository,
  type ContentTranslationRecord,
  type PendingSummaryInput,
} from "@/modules/summaries/summary.repository"
import { SummaryService, type SummaryGenerator } from "@/modules/summaries/summary.service"

function makePendingInput(
  overrides: Partial<PendingSummaryInput> = {}
): PendingSummaryInput {
  return {
    contentItemId: "content-1",
    slug: "tweet-1",
    kind: "tweet",
    title: null,
    url: "https://x.com/karpathy/status/1",
    publishedAt: "2026-04-05T14:58:44.000Z",
    rawPayload: {
      text: "Agents are moving from demos to durable execution workflows.",
    },
    plainText: "Agents are moving from demos to durable execution workflows.",
    creatorName: "Andrej Karpathy",
    creatorHandle: "karpathy",
    sourceName: "X / Andrej Karpathy",
    sourceUrl: "https://x.com/karpathy",
    ...overrides,
  }
}

describe("summary service", () => {
  it("stores bilingual summaries and translated content for each pending item", async () => {
    const repository = createInMemorySummaryRepository([makePendingInput()])
    const generator: SummaryGenerator = {
      generate: vi.fn(async () => ({
        summaries: [
          {
            locale: "en" as const,
            summary: "Execution loops make agent products more reliable.",
            bullets: ["Resume", "Inspect", "Continue"],
            model: "test-generator",
            status: "completed" as const,
          },
          {
            locale: "zh" as const,
            summary: "执行回路会让 agent 产品更可靠。",
            bullets: ["可恢复", "可检查", "可继续执行"],
            model: "test-generator",
            status: "completed" as const,
          },
        ],
        translations: [
          {
            locale: "zh" as const,
            title: "执行回路为什么重要",
            plainText: "执行回路会让 agent 产品更可靠，因为它们可以恢复、检查状态并继续执行。",
            model: "test-generator",
            status: "completed" as const,
          },
        ],
      })),
    }
    const service = new SummaryService(repository, generator)

    const result = await service.runPending()
    const snapshot = repository.snapshot()
    const locales = snapshot.summaries.map((item) => item.locale).sort()
    const translations = (
      snapshot.translations as ContentTranslationRecord[]
    ).map((item) => item.locale)

    expect(result.processed).toBe(1)
    expect(result.created).toBe(3)
    expect(locales).toEqual(["en", "zh"])
    expect(
      snapshot.summaries.find((item) => item.locale === "zh")?.summary
    ).toContain(
      "执行回路"
    )
    expect(translations).toEqual(["zh"])
    expect(snapshot.translations[0]?.plainText).toContain(
      "agent 产品"
    )
    expect(snapshot.translations[0]?.title).toContain(
      "执行回路"
    )
  })

  it("continues when one summary generation fails", async () => {
    const repository = createInMemorySummaryRepository([
      makePendingInput(),
      makePendingInput({
        contentItemId: "content-2",
        slug: "tweet-2",
      }),
    ])
    const generator: SummaryGenerator = {
      generate: vi.fn(async (input) => {
        if (input.contentItemId === "content-2") {
          throw new Error("generator failed")
        }

        return {
          summaries: [
            {
              locale: "en" as const,
              summary: "English summary",
              bullets: ["Point A"],
              model: "test-generator",
              status: "completed" as const,
            },
            {
              locale: "zh" as const,
              summary: "中文摘要",
              bullets: ["重点 A"],
              model: "test-generator",
              status: "completed" as const,
            },
          ],
          translations: [
            {
              locale: "zh" as const,
              title: "中文标题",
              plainText: "中文译文",
              model: "test-generator",
              status: "completed" as const,
            },
          ],
        }
      }),
    }
    const service = new SummaryService(repository, generator)

    const result = await service.runPending()

    expect(result.processed).toBe(2)
    expect(result.created).toBe(3)
    expect(result.failed).toBe(1)
    expect(result.errors[0]?.contentItemId).toBe("content-2")
    expect(repository.snapshot().summaries).toHaveLength(2)
    expect(repository.snapshot().translations).toHaveLength(1)
  })

  it("treats compact content as complete after Chinese summary and translation are stored", async () => {
    const repository = createInMemorySummaryRepository([makePendingInput()])
    const generator: SummaryGenerator = {
      generate: vi.fn(async () => ({
        summaries: [
          {
            locale: "zh" as const,
            summary: "Agents 正在从 demo 走向可持续执行。",
            bullets: [],
            model: "test-generator",
            status: "completed" as const,
          },
        ],
        translations: [
          {
            locale: "zh" as const,
            title: "Agents 正在从 demo 走向可持续执行",
            plainText: "Agents 正在从 demo 走向可持续执行工作流。",
            model: "test-generator",
            status: "completed" as const,
          },
        ],
      })),
    }
    const service = new SummaryService(repository, generator)

    const firstRun = await service.runPending()
    const secondRun = await service.runPending()

    expect(firstRun.processed).toBe(1)
    expect(firstRun.created).toBe(2)
    expect(secondRun.processed).toBe(0)
    expect(generator.generate).toHaveBeenCalledTimes(1)
  })
})
