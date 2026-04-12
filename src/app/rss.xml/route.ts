import { buildRssFeedXml } from "@/modules/content/rss"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const origin = new URL(request.url).origin
  const xml = await buildRssFeedXml({
    origin,
    title: "Briefinglab",
    description: "Briefinglab 最新 AI 内容聚合与双语摘要。",
    path: "/rss.xml",
    sitePath: "/",
    category: "all",
  })

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=900, stale-while-revalidate=3600",
    },
  })
}
