import { describe, expect, it } from "vitest"

import { createInMemoryPublicContentRepository } from "@/modules/content/public-content.repository"
import { createPublicContentService } from "@/modules/content/public-content.service"

const repository = createInMemoryPublicContentRepository([
  {
    id: "tweet-1",
    slug: "tweet-1",
    kind: "tweet",
    title: null,
    url: "https://x.com/karpathy/status/1",
    publishedAt: "2026-04-06T09:10:00.000Z",
    language: "en",
    rawPayload: {
      text: "Codex now supports longer-running engineering tasks &amp; deeper loops.",
    },
    creatorName: "Andrej Karpathy",
    creatorHandle: "karpathy",
    sourceName: "X / Andrej Karpathy",
    sourceUrl: "https://x.com/karpathy",
    plainText: "Codex now supports longer-running engineering tasks &amp; deeper loops.",
    summaries: [],
    translations: [],
  },
  {
    id: "blog-1",
    slug: "blog-1",
    kind: "blog_post",
    title: "Why execution loops matter",
    url: "https://example.com/blog-1",
    publishedAt: "2026-04-06T08:10:00.000Z",
    language: "en",
    rawPayload: {},
    creatorName: "Latent Space",
    creatorHandle: "latentspace",
    sourceName: "Latent Space",
    sourceUrl: "https://example.com",
    plainText:
      "Execution loops make agent products more reliable because they can resume, inspect state, and continue from partial work.",
    summaries: [
      {
        locale: "zh",
        summary: "这篇文章解释了为什么执行回路会让 agent 产品更可靠。",
        bullets: ["可恢复", "可检查", "可继续执行"],
      },
      {
        locale: "en",
        summary: "Execution loops make agent products more reliable.",
        bullets: ["Resume", "Inspect", "Continue"],
      },
    ],
    translations: [
      {
        locale: "zh",
        title: "为什么执行回路很重要",
        plainText:
          "执行回路让 agent 产品更可靠，因为系统可以恢复、检查状态并从部分结果继续执行。",
      },
    ],
  },
  {
    id: "podcast-1",
    slug: "podcast-1",
    kind: "podcast_episode",
    title: "Building durable agents",
    url: "https://example.com/podcast-1",
    publishedAt: "2026-04-05T21:10:00.000Z",
    language: "en",
    rawPayload: {},
    creatorName: "Latent Space",
    sourceName: "Latent Space",
    sourceUrl: "https://example.com",
    transcriptText:
      "Durable agents need checkpoints, retries, and structured handoffs between steps.",
    summaries: [
      {
        locale: "en",
        summary: "Durable agents rely on checkpoints and retries.",
        bullets: ["Checkpoints", "Retries"],
      },
    ],
    translations: [],
  },
])

describe("public-content.service", () => {
  const service = createPublicContentService(repository)

  it("returns category-filtered, cursor-paginated feed groups from the repository", async () => {
    const firstPage = await service.getPublicFeed({
      category: "article",
      limit: 1,
    })

    expect(firstPage.filters.category).toBe("article")
    expect(firstPage.groups).toHaveLength(1)
    expect(firstPage.groups[0]?.items[0]?.category).toBe("article")
    expect(firstPage.groups[0]?.items[0]?.cardType).toBe("digest")
    expect(firstPage.pagination.hasMore).toBe(true)
    expect(firstPage.pagination.nextCursor).toBeTruthy()

    const secondPage = await service.getPublicFeed({
      category: "article",
      limit: 1,
      cursor: firstPage.pagination.nextCursor ?? undefined,
    })

    expect(secondPage.groups.flatMap((group) => group.items)).toHaveLength(1)
    expect(secondPage.groups[0]?.items[0]?.slug).toBe("podcast-1")
  })

  it("returns summary-first detail payload with repository-backed related items", async () => {
    const detail = await service.getPublicContentDetail("blog-1")

    expect(detail).not.toBeNull()
    expect(detail?.slug).toBe("blog-1")
    expect(detail?.title).toBe("为什么执行回路很重要")
    expect(detail?.summary.locale).toBe("zh")
    expect(detail?.summary.bullets.length).toBeGreaterThan(0)
    expect(detail?.summaries.en?.summary).toContain("Execution loops")
    expect(detail?.body.translation?.text).toContain("执行回路")
    expect(detail?.body.original.text).toContain("Execution loops")
    expect(detail?.relatedItems[0]?.slug).toBe("podcast-1")
    expect(detail?.source.url).toContain("https://")
  })

  it("builds a readable fallback title and decodes original text for untitled tweets", async () => {
    const detail = await service.getPublicContentDetail("tweet-1")

    expect(detail).not.toBeNull()
    expect(detail?.title).toContain("Codex now supports")
    expect(detail?.title?.length).toBeGreaterThan(10)
    expect(detail?.body.original.text).toBe(
      "Codex now supports longer-running engineering tasks & deeper loops."
    )
  })
})
