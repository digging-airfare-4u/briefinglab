import { readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it, vi } from "vitest"

const feedItems = [
  {
    id: "blog-1",
    slug: "blog-1",
    category: "article",
    cardType: "digest",
    title: "Why execution loops matter",
    contentUrl: "https://example.com/blog-1",
    excerpt: "Execution loops make agent products more reliable.",
    summary: {
      locale: "zh",
      text: "这篇文章解释了为什么执行回路会让 agent 产品更可靠。",
      bullets: ["可恢复", "可检查", "可继续执行"],
      isFallback: false,
    },
    summaries: {
      zh: {
        locale: "zh",
        summary: "这篇文章解释了为什么执行回路会让 agent 产品更可靠。",
        bullets: ["可恢复", "可检查", "可继续执行"],
        isFallback: false,
      },
      en: {
        locale: "en",
        summary: "Execution loops make agent products more reliable.",
        bullets: ["Resume", "Inspect", "Continue"],
        isFallback: false,
      },
    },
    body: {
      original: {
        locale: "en",
        title: "Why execution loops matter",
        text: "Execution loops make agent products more reliable.",
      },
      translation: {
        locale: "zh",
        title: "为什么执行回路很重要",
        text: "执行回路会让 agent 产品更可靠。",
      },
    },
    creator: {
      name: "Latent Space",
      handle: "latentspace",
    },
    source: {
      name: "Latent Space",
      url: "https://example.com",
    },
    publishedAt: "2026-04-06T08:10:00.000Z",
    readTime: "3 分钟摘要",
    badges: ["文章", "中文摘要"],
  },
  {
    id: "tweet-1",
    slug: "tweet-1",
    category: "news",
    cardType: "standard",
    title: null,
    contentUrl: "https://x.com/karpathy/status/1",
    excerpt: "Codex now supports longer-running engineering tasks.",
    summary: {
      locale: "zh",
      text: "Codex 正在支持更长的工程执行链路。",
      bullets: ["长任务", "可恢复"],
      isFallback: false,
    },
    summaries: {
      zh: {
        locale: "zh",
        summary: "Codex 正在支持更长的工程执行链路。",
        bullets: ["长任务", "可恢复"],
        isFallback: false,
      },
    },
    body: {
      original: {
        locale: "en",
        title: null,
        text: "Codex now supports longer-running engineering tasks.",
      },
      translation: null,
    },
    creator: {
      name: "Andrej Karpathy",
      handle: "karpathy",
    },
    source: {
      name: "X / Andrej Karpathy",
      url: "https://x.com/karpathy",
    },
    publishedAt: "2026-04-06T09:10:00.000Z",
    readTime: "1 分钟",
    badges: ["动态", "中文摘要"],
  },
]

vi.mock("@/modules/content/public-content.service", () => ({
  listPublicFeedItems: vi.fn(async () => feedItems),
  getPublicFeed: vi.fn(async (query: { category?: string; limit?: number } = {}) => {
    const filtered =
      query.category && query.category !== "all"
        ? feedItems.filter((item) => item.category === query.category)
        : feedItems
    const sorted = [...filtered].sort((a, b) =>
      a.publishedAt < b.publishedAt ? 1 : -1
    )
    return {
      groups: [{ key: "2026-04-06", label: "4月6日 周一", items: sorted }],
      filters: {
        category: query.category ?? "all",
        source: null,
        counts: {
          all: feedItems.length,
          article: feedItems.filter((i) => i.category === "article").length,
          news: feedItems.filter((i) => i.category === "news").length,
        },
      },
      pagination: {
        limit: query.limit ?? 10,
        nextCursor: null,
        hasMore: false,
      },
    }
  }),
  getPublicContentDetail: vi.fn(async (slug: string) =>
    slug === "blog-1"
      ? {
          id: "blog-1",
          slug: "blog-1",
          category: "article",
          cardType: "digest",
          title: "Why execution loops matter",
          excerpt: "Execution loops make agent products more reliable.",
          summary: {
            locale: "zh",
            text: "这篇文章解释了为什么执行回路会让 agent 产品更可靠。",
            bullets: ["可恢复", "可检查", "可继续执行"],
            isFallback: false,
          },
          summaries: {
            zh: {
              locale: "zh",
              summary: "这篇文章解释了为什么执行回路会让 agent 产品更可靠。",
              bullets: ["可恢复", "可检查", "可继续执行"],
              isFallback: false,
            },
            en: {
              locale: "en",
              summary: "Execution loops make agent products more reliable.",
              bullets: ["Resume", "Inspect", "Continue"],
              isFallback: false,
            },
          },
          body: {
            original: {
              locale: "en",
              title: "Why execution loops matter",
              text: "Execution loops make agent products more reliable.",
            },
            translation: {
              locale: "zh",
              title: "为什么执行回路很重要",
              text: "执行回路会让 agent 产品更可靠。",
            },
          },
          creator: {
            name: "Latent Space",
            handle: "latentspace",
          },
          source: {
            name: "Latent Space",
            url: "https://example.com",
          },
          publishedAt: "2026-04-06T08:10:00.000Z",
          readTime: "3 分钟摘要",
          badges: ["文章", "中文摘要"],
          relatedItems: [
            {
              id: "podcast-1",
              slug: "podcast-1",
              category: "article",
              cardType: "digest",
              title: "Building durable agents",
              excerpt: "Durable agents need checkpoints and retries.",
              summary: {
                locale: "en",
                text: "Durable agents rely on checkpoints and retries.",
                bullets: ["Checkpoints", "Retries"],
                isFallback: false,
              },
              summaries: {
                en: {
                  locale: "en",
                  summary: "Durable agents rely on checkpoints and retries.",
                  bullets: ["Checkpoints", "Retries"],
                  isFallback: false,
                },
              },
              body: {
                original: {
                  locale: "en",
                  title: "Building durable agents",
                  text: "Durable agents need checkpoints and retries.",
                },
                translation: null,
              },
              creator: {
                name: "Latent Space",
              },
              source: {
                name: "Latent Space",
                url: "https://example.com",
              },
              publishedAt: "2026-04-05T21:10:00.000Z",
              readTime: "2 分钟摘要",
              badges: ["播客"],
            },
          ],
        }
      : slug === "blog-compact-1"
        ? {
            id: "blog-compact-1",
            slug: "blog-compact-1",
            kind: "blog_post",
            category: "article",
            cardType: "digest",
            title: "Why small launches matter",
            excerpt: "Small launches should be easy to scan.",
            summary: {
              locale: "zh",
              text: "小发布内容应该直接展示原文和译文。",
              bullets: ["保持轻量"],
              isFallback: false,
            },
            summaries: {
              zh: {
                locale: "zh",
                summary: "小发布内容应该直接展示原文和译文。",
                bullets: ["保持轻量"],
                isFallback: false,
              },
              en: {
                locale: "en",
                summary: "Small launches should be easy to scan.",
                bullets: ["Easy to scan"],
                isFallback: false,
              },
            },
            body: {
              original: {
                locale: "en",
                title: "Why small launches matter",
                text:
                  "Small launches should be easy to scan. Show the original and a strong translation.",
              },
              translation: {
                locale: "zh",
                title: "为什么小发布也值得读",
                text: "小发布应该让人快速看完。直接展示原文和高质量译文即可。",
              },
            },
            creator: {
              name: "Example Author",
              handle: "example",
            },
            source: {
              name: "Example Blog",
              url: "https://example.com/blog-compact-1",
            },
            publishedAt: "2026-04-06T10:10:00.000Z",
            readTime: "1 分钟",
            badges: ["文章", "中文摘要", "全文翻译"],
            relatedItems: [],
          }
      : slug === "podcast-1"
        ? {
            id: "podcast-1",
            slug: "podcast-1",
            kind: "podcast_episode",
            url: "https://example.com/podcast-1",
            category: "article",
            cardType: "digest",
            title: "Building durable agents",
            excerpt: "Durable agents need checkpoints and retries.",
            summary: {
              locale: "zh",
              text: "这期播客讨论 durable agents 为什么需要 checkpoint 和 retry。",
              bullets: ["Checkpoint", "Retry"],
              isFallback: false,
            },
            summaries: {
              zh: {
                locale: "zh",
                summary: "这期播客讨论 durable agents 为什么需要 checkpoint 和 retry。",
                bullets: ["Checkpoint", "Retry"],
                isFallback: false,
              },
            },
            body: {
              original: {
                locale: "en",
                title: "Building durable agents",
                text: "Speaker 1 | 00:00 - 00:20 Durable agents need checkpoints.",
              },
              translation: {
                locale: "zh",
                title: "构建可持续执行的 agents",
                text: "主持人 | 00:00 - 00:20 Durable agents 需要 checkpoint。",
              },
            },
            creator: {
              name: "Latent Space",
              handle: "latentspace",
            },
            source: {
              name: "Latent Space",
              url: "https://example.com",
            },
            publishedAt: "2026-04-05T21:10:00.000Z",
            readTime: "2 分钟摘要",
            badges: ["播客", "中文摘要"],
            duration: "1:06:37",
            timeline: [
              {
                start: "00:00",
                title: "Durable agents need checkpoints.",
              },
            ],
            relatedItems: [],
          }
      : null
  ),
}))

import {
  getContentDetailPageData,
  getDeepPageData,
  getHomePageData,
  getLatestPageData,
} from "@/modules/content/public-content.adapter"

const projectRoot = "/Users/cj/Documents/personal/project/caiji"

describe("public-content adapter", () => {
  it("builds homepage data without exposing storage terms to the client", async () => {
    const data = (await getHomePageData()) as Awaited<
      ReturnType<typeof getHomePageData>
    > & {
      sources?: Array<{
        id: string
        name: string
        typeLabel: string
        handle?: string
        description: string
        avatarUrl?: string
      }>
    }

    expect(data.categories.map((item) => item.id)).toEqual([
      "all",
      "article",
      "news",
    ])
    expect(data.items.length).toBeGreaterThan(0)
    expect(data.items[0]).toHaveProperty("sourceName")
    expect(data.items[0]).toHaveProperty("creatorName")
    expect(data.sources).toBeDefined()
    expect(data.sources!.length).toBeGreaterThanOrEqual(2)
    expect(data.sources?.find((item) => item.handle === "karpathy")).toMatchObject({
      name: "Andrej Karpathy",
      typeLabel: "X 账号",
      handle: "karpathy",
      description: expect.any(String),
      avatarUrl: expect.stringContaining("karpathy"),
    })
    expect(data.sources?.find((item) => item.name === "Latent Space")).toMatchObject({
      name: "Latent Space",
      typeLabel: "播客",
      description: expect.any(String),
    })
    expect(data.nextCursor).toBeNull()
    expect(data.hasMore).toBe(false)
  })

  it("builds latest, deep and detail page data from the shared adapter layer", async () => {
    const latest = await getLatestPageData()
    const deep = await getDeepPageData()
    const detail = await getContentDetailPageData("blog-1")

    expect(latest.items.length).toBeGreaterThan(0)
    expect(deep.items[0]?.cardType).toBe("digest")
    expect(deep.items.every((item) => item.category === "article")).toBe(true)
    expect(detail?.item.slug).toBe("blog-1")
    expect(detail?.item.originalText).toContain("Execution loops")
    expect(detail?.item.translatedText).toContain("执行回路")
    expect(detail?.item.englishSummary).toContain("Execution loops")
    expect(detail?.relatedItems.length).toBeGreaterThan(0)
  })

  it("maps podcast-specific detail fields when present", async () => {
    const detail = await getContentDetailPageData("podcast-1")
    const item = detail?.item as
      | (Record<string, unknown> & {
          timeline?: Array<Record<string, string>>
        })
      | undefined

    expect(item?.kind).toBe("podcast_episode")
    expect(item?.contentUrl).toBe("https://example.com/podcast-1")
    expect(item?.duration).toBe("1:06:37")
    expect(item?.timeline?.[0]).toMatchObject({
      start: "00:00",
      title: "Durable agents need checkpoints.",
    })
    expect(item?.detailMode).toBe("deep")
  })

  it("classifies short non-podcast content as compact detail", async () => {
    const detail = await getContentDetailPageData("blog-compact-1")

    expect(detail?.item.slug).toBe("blog-compact-1")
    expect(detail?.item.detailMode).toBe("compact")
    expect(detail?.item.englishSummary).toContain("Small launches")
  })

  it("keeps app and site UI away from mock-content imports", () => {
    const files = [
      "src/app/page.tsx",
      "src/app/latest/page.tsx",
      "src/app/deep/page.tsx",
      "src/app/content/[slug]/page.tsx",
      "src/components/site/home-page-client.tsx",
      "src/components/site/content-card.tsx",
      "src/components/site/detail-page.tsx",
      "src/components/site/editorial-rail.tsx",
      "src/components/site/site-header.tsx",
      "src/components/site/category-sidebar.tsx",
      "src/modules/content/public-content.service.ts",
    ]

    for (const file of files) {
      const content = readFileSync(path.join(projectRoot, file), "utf8")
      expect(content.includes("@/data/mock-content")).toBe(false)
    }
  })
})
