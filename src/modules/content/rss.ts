import {
  getPublicFeed,
  type CategoryFilter,
  type PublicFeedItem,
} from "@/modules/content/public-content.service"

const RSS_LIMIT = 50

type RssChannelConfig = {
  title: string
  description: string
  path: string
  sitePath: string
  category: CategoryFilter
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function normalizeOrigin(origin: string) {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin
}

function buildUrl(origin: string, path: string) {
  return new URL(path, `${normalizeOrigin(origin)}/`).toString()
}

function buildItemTitle(item: PublicFeedItem) {
  return item.title?.trim() || item.excerpt.trim() || `${item.creator.name} 的更新`
}

function buildItemDescription(item: PublicFeedItem) {
  const lines = [item.summary.text]

  if (item.summary.bullets.length > 0) {
    lines.push("", ...item.summary.bullets.map((bullet) => `- ${bullet}`))
  }

  lines.push("", `来源：${item.source.name}`, `原文：${item.contentUrl}`)

  return lines.join("\n").trim()
}

function flattenFeedItems(groups: Awaited<ReturnType<typeof getPublicFeed>>["groups"]) {
  return groups.flatMap((group) => group.items)
}

export async function buildRssFeedXml({
  origin,
  title,
  description,
  path,
  sitePath,
  category,
}: RssChannelConfig & {
  origin: string
}) {
  const feed = await getPublicFeed({
    category,
    limit: RSS_LIMIT,
  })
  const items = flattenFeedItems(feed.groups)
  const siteUrl = buildUrl(origin, sitePath)
  const selfUrl = buildUrl(origin, path)
  const latestDate =
    items[0]?.publishedAt ?? new Date().toISOString()

  const itemXml = items
    .map((item) => {
      const detailUrl = buildUrl(origin, `/content/${item.slug}`)

      return `    <item>
      <title>${escapeXml(buildItemTitle(item))}</title>
      <link>${escapeXml(detailUrl)}</link>
      <guid isPermaLink="true">${escapeXml(detailUrl)}</guid>
      <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>
      <author>${escapeXml(item.creator.name)}</author>
      <category>${escapeXml(item.category)}</category>
      <description>${escapeXml(buildItemDescription(item))}</description>
      <source url="${escapeXml(item.contentUrl)}">${escapeXml(item.source.name)}</source>
    </item>`
    })
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date(latestDate).toUTCString()}</lastBuildDate>
    <generator>Briefinglab</generator>
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />
${itemXml}
  </channel>
</rss>`
}
