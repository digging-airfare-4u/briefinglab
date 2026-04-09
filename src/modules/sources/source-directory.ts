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

export type ObservedSourceInput = {
  sourceName: string
  sourceUrl: string
  creatorHandle?: string
  kind?: "tweet" | "podcast_episode" | "blog_post"
}

type SourceDirectoryTypeLabel = SourceDirectoryItem["typeLabel"]

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

function inferSourceTypeFromObservedSource(
  item: ObservedSourceInput
): SourceType {
  switch (item.kind) {
    case "tweet":
      return "x_account"
    case "podcast_episode":
      return "podcast"
    case "blog_post":
      return "blog"
    default:
      if (item.sourceUrl.includes("x.com/")) {
        return "x_account"
      }
      if (
        item.sourceUrl.includes("youtube.com/") ||
        item.sourceUrl.includes("spotify.com/") ||
        item.sourceName.toLowerCase().includes("podcast")
      ) {
        return "podcast"
      }
      return "blog"
  }
}

function buildDefaultAvatarUrl(type: SourceType, href: string, handle?: string) {
  if (type === "x_account" && handle) {
    return `https://unavatar.io/x/${handle}`
  }

  if (type === "podcast") {
    return `https://unavatar.io/${href}`
  }

  if (type === "blog") {
    return `https://unavatar.io/${href}`
  }

  return undefined
}

function buildFallbackDescription(type: SourceType, name: string) {
  switch (type) {
    case "x_account":
      return `持续跟踪 ${name} 的公开动态与原始发布。`
    case "podcast":
      return `持续跟踪 ${name} 的节目更新与对话内容。`
    case "blog":
      return `持续跟踪 ${name} 的长文更新和技术输出。`
    case "upstream_feed":
      return `持续跟踪 ${name} 作为上游公开来源。`
  }
}

function buildDefaultIndex() {
  const byKey = new Map<string, SourceSeed>()
  const byHandle = new Map<string, SourceSeed>()
  const byHref = new Map<string, SourceSeed>()
  const byName = new Map<string, SourceSeed>()

  for (const source of defaultSources) {
    byKey.set(source.key, source)
    byName.set(source.name.toLowerCase(), source)

    if (source.externalHandle) {
      byHandle.set(source.externalHandle.toLowerCase(), source)
    }

    if (source.homepageUrl) {
      byHref.set(source.homepageUrl, source)
    }
  }

  return { byKey, byHandle, byHref, byName }
}

function typeLabelToType(label: SourceDirectoryTypeLabel): SourceType {
  switch (label) {
    case "X 账号":
      return "x_account"
    case "播客":
      return "podcast"
    case "博客":
      return "blog"
    case "公开 Feed":
      return "upstream_feed"
  }

  return "blog"
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

export function listObservedSourceDirectoryItems(
  sources: ObservedSourceInput[]
): SourceDirectoryItem[] {
  const sourceIndex = buildDefaultIndex()
  const uniqueSources = new Map<string, ObservedSourceInput>()

  for (const source of sources) {
    const handle = source.creatorHandle?.toLowerCase()
    const key = handle
      ? `handle:${handle}`
      : `source:${source.sourceName.toLowerCase()}::${source.sourceUrl}`

    if (!uniqueSources.has(key)) {
      uniqueSources.set(key, source)
    }
  }

  return [...uniqueSources.values()]
    .map((source) => {
      const normalizedHandle = source.creatorHandle?.replace(/^@/, "").toLowerCase()
      const matchedDefault =
        (normalizedHandle
          ? sourceIndex.byHandle.get(normalizedHandle)
          : undefined) ??
        sourceIndex.byHref.get(source.sourceUrl) ??
        sourceIndex.byName.get(source.sourceName.toLowerCase())
      const type = matchedDefault?.type ?? inferSourceTypeFromObservedSource(source)
      const handle = normalizedHandle ?? matchedDefault?.externalHandle
      const href = matchedDefault?.homepageUrl ?? source.sourceUrl

      return {
        id: matchedDefault?.key ?? `${type}-${handle ?? source.sourceName.toLowerCase().replace(/\s+/g, "-")}`,
        name: matchedDefault?.name ?? source.sourceName,
        typeLabel: typeLabels[type],
        handle,
        description:
          matchedDefault?.description ??
          buildFallbackDescription(type, matchedDefault?.name ?? source.sourceName),
        avatarUrl:
          matchedDefault?.avatarUrl ?? buildDefaultAvatarUrl(type, href, handle),
        href,
      } satisfies SourceDirectoryItem
    })
    .sort((left, right) => {
      const typeScore =
        typeOrder[typeLabelToType(left.typeLabel)] -
        typeOrder[typeLabelToType(right.typeLabel)]

      if (typeScore !== 0) {
        return typeScore
      }

      return left.name.localeCompare(right.name)
    })
}
