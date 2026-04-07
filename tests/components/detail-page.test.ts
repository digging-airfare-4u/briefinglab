import { createElement } from "react"
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
    children: unknown
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
    children: unknown
  }) => createElement("div", props, children),
  TabsList: ({
    children,
    ...props
  }: {
    children: unknown
  }) => createElement("div", props, children),
  TabsTrigger: ({
    children,
    ...props
  }: {
    children: unknown
  }) => createElement("button", props, children),
  TabsContent: ({
    children,
    ...props
  }: {
    children: unknown
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
})
