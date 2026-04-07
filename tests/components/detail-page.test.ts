import { createElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { DetailPage } from "@/components/site/detail-page"
import type {
  ContentDetailItem,
  ContentListItem,
} from "@/modules/content/public-content.view-model"

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode
    href: string
  }) =>
    createElement("a", {
      href,
      ...props,
    }, children),
}))

vi.mock("@/components/site/site-header", () => ({
  SiteHeader: () => createElement("div", {}, "site header"),
}))

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({
    children,
    ...props
  }: {
    children: ReactNode
  }) => createElement("div", props, children),
  TabsList: ({
    children,
    ...props
  }: {
    children: ReactNode
  }) => createElement("div", props, children),
  TabsTrigger: ({
    children,
    ...props
  }: {
    children: ReactNode
  }) => createElement("button", props, children),
  TabsContent: ({
    children,
    ...props
  }: {
    children: ReactNode
  }) => createElement("div", props, children),
}))

const detailItem: ContentDetailItem = {
  id: "blog-1",
  slug: "blog-1",
  title: "为什么执行回路很重要",
  excerpt: "执行回路会让 agent 产品更可靠。",
  summary: "这篇文章解释了为什么执行回路会让 agent 产品更可靠。",
  bullets: ["可恢复", "可检查", "可继续执行"],
  category: "article",
  cardType: "digest",
  sourceName: "Latent Space",
  sourceUrl: "https://example.com/blog-1",
  creatorName: "Latent Space",
  creatorHandle: "latentspace",
  publishedAt: "2026-04-06T08:10:00.000Z",
  readTime: "3 分钟摘要",
  badges: ["文章", "中文摘要"],
  sourceLanguage: "en",
  originalTitle: "Why execution loops matter",
  translatedTitle: "为什么执行回路很重要",
  originalText: "Execution loops make agent products more reliable.",
  translatedText: "执行回路会让 agent 产品更可靠。",
  englishSummary: "Execution loops make agent products more reliable.",
  englishBullets: ["Resume", "Inspect", "Continue"],
}

const relatedItems: ContentListItem[] = [
  {
    id: "podcast-1",
    slug: "podcast-1",
    title: "Building durable agents",
    excerpt: "Durable agents need checkpoints and retries.",
    summary: "Durable agents rely on checkpoints and retries.",
    bullets: ["Checkpoints", "Retries"],
    category: "article",
    cardType: "digest",
    sourceName: "Latent Space",
    sourceUrl: "https://example.com/podcast-1",
    creatorName: "Latent Space",
    creatorHandle: "latentspace",
    publishedAt: "2026-04-05T21:10:00.000Z",
    readTime: "2 分钟摘要",
    badges: ["播客"],
  },
]

const podcastDetailItem = {
  id: "podcast-42",
  slug: "podcast-42",
  kind: "podcast_episode",
  contentUrl: "https://example.com/podcast-42",
  title: "MoonLake：因果世界模型应该是多模态、交互式和高效的",
  excerpt: "这期播客讨论为什么世界模型需要动作条件、语义抽象和更强的交互能力。",
  summary:
    "这期节目围绕世界模型为什么不能只停留在视频生成，以及 MoonLake 如何用更结构化的方式处理多模态推理。",
  bullets: [
    "视频生成不等于世界理解",
    "语义抽象可能比像素级建模更高效",
    "动作条件数据对世界模型很关键",
  ],
  category: "article",
  cardType: "digest",
  sourceName: "Latent Space",
  sourceUrl: "https://www.youtube.com/@LatentSpacePod",
  creatorName: "Latent Space",
  creatorHandle: "@latentspace",
  publishedAt: "2026-04-02T09:55:00.000Z",
  readTime: "173 分钟摘要",
  badges: ["播客", "中文摘要", "全文翻译"],
  sourceLanguage: "en",
  duration: "1:06:37",
  timeline: [
    {
      start: "00:00",
      title: "为什么这个领域现在还很难做。",
    },
    {
      start: "08:35",
      title: "为什么世界模型需要比 next-token 更多的结构。",
    },
  ],
  originalTitle:
    "Moonlake: Causal World Models should be Multimodal, Interactive, and Efficient",
  originalText: "Speaker 1 | 00:00 - 00:20 I think this field is very hard.",
  translatedText: "主持人1 | 00:00 - 00:20 我认为这个领域现在非常难。",
} as unknown as ContentDetailItem

describe("DetailPage", () => {
  it("does not render the related content section", () => {
    const html = renderToStaticMarkup(
      createElement(DetailPage, {
        item: detailItem,
        relatedItems,
      })
    )

    expect(html).not.toContain("相关内容")
    expect(html).not.toContain("Building durable agents")
  })

  it("renders podcast detail pages with listen-first information hierarchy", () => {
    const html = renderToStaticMarkup(
      createElement(DetailPage, {
        item: podcastDetailItem,
      })
    )

    expect(html).toContain("立即收听")
    expect(html).toContain("对话时间线")
    expect(html).toContain("对话逐字稿")
    expect(html).toContain("打开原节目")
    expect(html.indexOf("立即收听")).toBeLessThan(html.indexOf("对话时间线"))
    expect(html.indexOf("对话时间线")).toBeLessThan(html.indexOf("对话逐字稿"))
  })

  it("links timeline items to matching transcript anchors when timestamps exist", () => {
    const html = renderToStaticMarkup(
      createElement(DetailPage, {
        item: {
          ...podcastDetailItem,
          originalText: `Speaker 1 | 00:00 - 00:20 I think this field is very hard.
Speaker 2 | 08:35 - 08:59 You want more structure than next-token prediction.`,
          translatedText: `主持人1 | 00:00 - 00:20 我认为这个领域现在非常难。
主持人2 | 08:35 - 08:59 你需要比 next-token 更多的结构。`,
        },
      })
    )

    expect(html).toContain('href="#translation-transcript-00-00"')
    expect(html).toContain('href="#translation-transcript-08-35"')
    expect(html).toContain('id="translation-transcript-00-00"')
    expect(html).toContain('id="translation-transcript-08-35"')
  })
})
