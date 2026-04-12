import { buildRssFeedXml } from "@/modules/content/rss"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const origin = new URL(request.url).origin
  const xml = await buildRssFeedXml({
    origin,
    title: "Briefinglab / 动态",
    description: "Briefinglab 的最新 AI 动态与短内容双语摘要。",
    path: "/rss/news.xml",
    sitePath: "/latest",
    category: "news",
  })

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=900, stale-while-revalidate=3600",
    },
  })
}
