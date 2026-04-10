import { afterEach, describe, expect, it, vi } from "vitest"

import { runSummaryJobs } from "@/modules/summaries/summary.job"
import {
  createInMemorySummaryRepository,
  type PendingSummaryInput,
} from "@/modules/summaries/summary.repository"

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
    language: "en",
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

describe("summary job", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("returns an explicit warning when LLM config is missing", async () => {
    vi.stubEnv("LLM_BASE_URL", "")
    vi.stubEnv("LLM_API_KEY", "")
    vi.stubEnv("LLM_MODEL", "")
    vi.stubEnv("OPENAI_BASE_URL", "")
    vi.stubEnv("OPENAI_API_KEY", "")
    vi.stubEnv("OPENAI_MODEL", "")

    const repository = createInMemorySummaryRepository([makePendingInput()])

    const result = await runSummaryJobs({
      repository,
      limit: 1,
    })

    expect(result.processed).toBe(1)
    expect(result.created).toBe(2)
    expect(result.failed).toBe(0)
    expect(result.warnings).toEqual([
      expect.stringContaining("LLM"),
    ])
    expect(repository.snapshot().translations).toEqual([])
  })
})
