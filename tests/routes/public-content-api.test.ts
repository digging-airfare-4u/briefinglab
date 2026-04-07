import { describe, expect, it, vi } from "vitest"

vi.mock("@/modules/content/public-content.service", () => ({
  getPublicFeed: vi.fn(async () => ({
    groups: [
      {
        key: "2026-04-06",
        label: "4月6日 周一",
        items: [
          {
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
        ],
      },
    ],
    filters: {
      category: "article",
      source: null,
      counts: {
        all: 1,
        article: 1,
        news: 0,
      },
    },
    pagination: {
      limit: 2,
      nextCursor: null,
      hasMore: false,
    },
  })),
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
          relatedItems: [],
        }
      : null
  ),
}))

import { GET as getContentDetail } from "@/app/api/content/[slug]/route"
import { GET as getFeed } from "@/app/api/content/feed/route"

describe("public content api routes", () => {
  it("serves feed response shaped for grouped homepage rendering", async () => {
    const response = await getFeed(
      new Request("http://localhost:3000/api/content/feed?category=article&limit=2")
    )

    expect(response.status).toBe(200)

    const payload = await response.json()

    expect(payload.filters.category).toBe("article")
    expect(payload.groups.length).toBeGreaterThan(0)
    expect(
      payload.groups[0].items.every(
        (item: { category: string }) => item.category === "article"
      )
    ).toBe(true)
  })

  it("returns 404 for missing content detail slug", async () => {
    const response = await getContentDetail(
      new Request("http://localhost:3000/api/content/missing"),
      {
        params: Promise.resolve({ slug: "missing" }),
      }
    )

    expect(response.status).toBe(404)
  })
})
