import { buildRssFeedXml } from "@/modules/content/rss"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const origin = new URL(request.url).origin
  const xml = await buildRssFeedXml({
    origin,
    title: "Briefinglab / 长内容",
    description: "Briefinglab 的最新文章、播客与长内容摘要。",
    path: "/rss/articles.xml",
    sitePath: "/deep",
    category: "article",
  })

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=900, stale-while-revalidate=3600",
    },
  })
}
