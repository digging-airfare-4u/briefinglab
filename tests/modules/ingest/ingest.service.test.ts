import { describe, expect, it } from "vitest"

import { createInMemoryContentRepository } from "@/modules/content/content.repository"
import { IngestService } from "@/modules/ingest/ingest.service"
import type { NormalizedContent } from "@/modules/ingest/types"

function makeTweet(overrides: Partial<NormalizedContent> = {}): NormalizedContent {
  return {
    sourceKey: "x-karpathy",
    creatorExternalId: "karpathy",
    creatorDisplayName: "Andrej Karpathy",
    creatorHandle: "karpathy",
    creatorProfileUrl: "https://x.com/karpathy",
    kind: "tweet",
    externalId: "2040806346556428585",
    title: null,
    url: "https://x.com/karpathy/status/2040806346556428585",
    publishedAt: "2026-04-05T14:58:44.000Z",
    plainText: "hello world",
    metrics: {
      likes: 1,
      shares: 2,
      replies: 3,
    },
    rawPayload: {
      id: "2040806346556428585",
    },
    ...overrides,
  }
}

describe("ingest service", () => {
  it("persists normalized items with idempotent upsert semantics", async () => {
    const repository = createInMemoryContentRepository()
    const service = new IngestService(repository)
    const runId = await service.startRun("follow-builders-feed")

    await service.persistItems(runId, [
      makeTweet(),
      makeTweet({
        plainText: "updated text",
        metrics: {
          likes: 8,
          shares: 5,
          replies: 1,
        },
      }),
    ])
    await service.finishRun(runId, { items: 2 })

    const snapshot = repository.snapshot()

    expect(snapshot.runs).toHaveLength(1)
    expect(snapshot.runs[0]?.status).toBe("completed")
    expect(snapshot.sources).toHaveLength(1)
    expect(snapshot.creators).toHaveLength(1)
    expect(snapshot.contentItems).toHaveLength(1)
    expect(snapshot.contentItems[0]?.slug).toBe("tweet-2040806346556428585")
    expect(snapshot.contentBodies[0]?.plainText).toBe("updated text")
    expect(snapshot.contentMetrics[0]?.likes).toBe(8)
  })
})
