import { createElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { HomePageClient } from "@/components/site/home-page-client"
import type {
  CategoryOption,
  ContentListItem,
} from "@/modules/content/public-content.view-model"

vi.mock("@/components/site/site-header", () => ({
  SiteHeader: () => createElement("div", {}, "site header"),
}))

vi.mock("@/components/site/category-sidebar", () => ({
  CategorySidebar: () => createElement("div", {}, "category sidebar"),
}))

vi.mock("@/components/site/date-group-heading", () => ({
  DateGroupHeading: ({ label }: { label: string }) =>
    createElement("div", {}, label),
}))

vi.mock("@/components/site/content-card", () => ({
  StandardContentCard: ({ item }: { item: ContentListItem }) =>
    createElement("article", {}, item.title || item.excerpt),
  DigestContentCard: ({ item }: { item: ContentListItem }) =>
    createElement("article", {}, item.title || item.excerpt),
}))

vi.mock("@/components/site/reveal-on-scroll", () => ({
  RevealOnScroll: ({
    children,
    className,
  }: {
    children: ReactNode
    className?: string
  }) => createElement("div", { className }, children),
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
}))

vi.mock("@/components/ui/hover-card", () => ({
  HoverCard: ({ children }: { children: ReactNode }) =>
    createElement("div", {}, children),
  HoverCardTrigger: ({
    children,
    ...props
  }: {
    children: ReactNode
    asChild?: boolean
  }) => {
    const nextProps = { ...props }
    delete (nextProps as { asChild?: boolean }).asChild

    return createElement("div", nextProps, children)
  },
  HoverCardContent: ({
    children,
    ...props
  }: {
    children: ReactNode
  }) => createElement("div", props, children),
}))

const categories: CategoryOption[] = [
  {
    id: "all",
    label: "全部内容",
    description: "今日所有 AI 动向",
    count: 1,
  },
]

const items: ContentListItem[] = [
  {
    id: "tweet-1",
    slug: "tweet-1",
    kind: "tweet",
    title: "Codex now supports longer-running engineering tasks.",
    contentUrl: "https://x.com/karpathy/status/1",
    excerpt: "Codex 正在支持更长的工程执行链路。",
    summary: "Codex 正在支持更长的工程执行链路。",
    bullets: ["长任务", "可恢复"],
    hasSummary: true,
    category: "news",
    cardType: "standard",
    sourceName: "X / Andrej Karpathy",
    sourceUrl: "https://x.com/karpathy",
    creatorName: "Andrej Karpathy",
    creatorHandle: "karpathy",
    publishedAt: "2026-04-06T09:10:00.000Z",
    readTime: "1 分钟",
    badges: ["动态", "中文摘要"],
  },
]

describe("HomePageClient", () => {
  it("renders a compact horizontal source rail above the timeline", () => {
    const html = renderToStaticMarkup(
      createElement(HomePageClient, {
        initialItems: items,
        categories,
        sources: [
          {
            id: "x-karpathy",
            name: "Andrej Karpathy",
            typeLabel: "X 账号",
            handle: "karpathy",
            description: "重点跟踪模型、训练与 AI 工程实践的一手动态。",
            avatarUrl: "https://unavatar.io/x/karpathy",
            href: "https://x.com/karpathy",
          },
          {
            id: "podcast-every",
            name: "AI & I by Every",
            typeLabel: "播客",
            description: "关注 AI 产品、创作者与团队的访谈内容。",
            href: "https://every.to/ai-and-i",
          },
        ],
      })
    )

    expect(html).toContain("数据源")
    expect(html).toContain("2 sources")
    expect(html).toContain("Andrej Karpathy")
    expect(html).toContain("@karpathy")
    expect(html).toContain("查看主页")
    expect(html).toContain("重点跟踪模型、训练与 AI 工程实践的一手动态。")
    expect(html).toContain('href="https://x.com/karpathy"')
    expect(html).toContain("source-rail-track")
    expect(html).toContain("--source-rail-duration:72s")
    expect(html).toContain("w-[184px]")
    expect(html).toContain("w-64")
    expect(html).toContain("展开全部来源")
    expect(html).not.toContain("我正在追踪这些公开来源")
    expect(html.indexOf("数据源")).toBeLessThan(
      html.indexOf("Codex now supports longer-running engineering tasks.")
    )
  })
})
