import { defaultSources, type SourceSeed, type SourceType } from "@/modules/sources/default-sources"

export type SourceDirectoryItem = {
  id: string
  name: string
  typeLabel: string
  handle?: string
  description: string
  avatarUrl?: string
  href: string
}

const typeLabels: Record<SourceType, string> = {
  x_account: "X 账号",
  podcast: "播客",
  blog: "博客",
  upstream_feed: "公开 Feed",
}

const typeOrder: Record<SourceType, number> = {
  x_account: 0,
  podcast: 1,
  blog: 2,
  upstream_feed: 3,
}

function getDefaultDescription(source: SourceSeed) {
  switch (source.type) {
    case "x_account":
      return "持续追踪这个账号的公开动态与原始发布。"
    case "podcast":
      return "持续跟踪这档节目，补充长对话里的观点和细节。"
    case "blog":
      return "持续跟踪这个博客的长文更新和技术输出。"
    case "upstream_feed":
      return "作为上游公开名单来源，用来扩展长期跟踪池。"
  }
}

export function listSourceDirectoryItems(
  sources = defaultSources
): SourceDirectoryItem[] {
  return [...sources]
    .sort((left, right) => typeOrder[left.type] - typeOrder[right.type])
    .map((source) => ({
      id: source.key,
      name: source.name,
      typeLabel: typeLabels[source.type],
      handle: source.externalHandle,
      description: source.description ?? getDefaultDescription(source),
      avatarUrl: source.avatarUrl,
      href: source.homepageUrl ?? "#",
    }))
}
