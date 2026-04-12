import { describe, expect, it, vi } from "vitest"

const getPublicFeed = vi.fn(async ({ category }: { category?: string } = {}) => {
  if (category === "news") {
    return {
      groups: [
        {
          key: "2026-04-06",
          label: "4月6日 周一",
          items: [
            {
              id: "tweet-1",
              slug: "tweet-1",
              kind: "tweet",
              category: "news",
              cardType: "standard",
              title: "Codex now supports longer-running engineering tasks",
              contentUrl: "https://x.com/karpathy/status/1",
              excerpt: "Codex 正在支持更长的工程执行链路。",
              summary: {
                locale: "zh",
                text: "Codex 正在支持更长的工程执行链路。",
                bullets: ["长任务", "可恢复"],
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
          ],
        },
      ],
      filters: {
        category: "news",
        source: null,
        counts: { all: 1, article: 0, news: 1 },
      },
      pagination: { limit: 50, nextCursor: null, hasMore: false },
    }
  }

  return {
    groups: [
      {
        key: "2026-04-06",
        label: "4月6日 周一",
        items: [
          {
            id: "blog-1",
            slug: "blog-1",
            kind: "blog_post",
            category: "article",
            cardType: "digest",
            title: "Why execution loops matter",
            contentUrl: "https://example.com/blog-1",
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
      category: category ?? "all",
      source: null,
      counts: { all: 1, article: 1, news: 0 },
    },
    pagination: { limit: 50, nextCursor: null, hasMore: false },
  }
})

vi.mock("@/modules/content/public-content.service", () => ({
  getPublicFeed,
}))

import { GET as getArticlesRss } from "@/app/rss/articles.xml/route"
import { GET as getRss } from "@/app/rss.xml/route"
import { GET as getNewsRss } from "@/app/rss/news.xml/route"

describe("rss routes", () => {
  it("serves the main RSS feed as XML", async () => {
    const response = await getRss(new Request("https://briefinglab.example/rss.xml"))
    const xml = await response.text()

    expect(response.headers.get("Content-Type")).toContain("application/rss+xml")
    expect(xml).toContain("<title>Briefinglab</title>")
    expect(xml).toContain("<link>https://briefinglab.example/content/blog-1</link>")
    expect(xml).toContain("这篇文章解释了为什么执行回路会让 agent 产品更可靠。")
    expect(xml).toContain("https://example.com/blog-1")
  })

  it("serves the news RSS feed with the news category", async () => {
    const response = await getNewsRss(
      new Request("https://briefinglab.example/rss/news.xml")
    )
    const xml = await response.text()

    expect(getPublicFeed).toHaveBeenCalledWith({
      category: "news",
      limit: 50,
    })
    expect(xml).toContain("<title>Briefinglab / 动态</title>")
    expect(xml).toContain("https://briefinglab.example/content/tweet-1")
    expect(xml).toContain("<category>news</category>")
  })

  it("serves the articles RSS feed with the article category", async () => {
    const response = await getArticlesRss(
      new Request("https://briefinglab.example/rss/articles.xml")
    )
    const xml = await response.text()

    expect(getPublicFeed).toHaveBeenCalledWith({
      category: "article",
      limit: 50,
    })
    expect(xml).toContain("<title>Briefinglab / 长内容</title>")
    expect(xml).toContain("<category>article</category>")
  })
})
