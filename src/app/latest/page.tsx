import { LatestPageClient } from "@/components/site/latest-page-client"
import { SiteHeader } from "@/components/site/site-header"
import { getLatestPageData } from "@/modules/content/public-content.adapter"
import { Badge } from "@/components/ui/badge"

export const revalidate = 300

export default async function LatestPage() {
  const data = await getLatestPageData()

  return (
    <div className="min-h-screen">
      <SiteHeader activeNav="latest" />
      <main className="app-shell space-y-8 pb-20 pt-8">
        <section className="border-b border-border/70 pb-4">
          <Badge className="rounded-full bg-primary/8 text-primary hover:bg-primary/8">
            快讯流
          </Badge>
          <h1 className="mt-4 font-heading text-3xl tracking-tight text-foreground">
            最新 AI 动向
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            这里优先保留时间顺序，适合先快速扫一遍当天发生了什么。
          </p>
        </section>

        <LatestPageClient
          initialItems={data.items}
          dailySummaries={data.dailySummaries}
          initialCursor={data.nextCursor}
          initialHasMore={data.hasMore}
        />
      </main>
    </div>
  )
}
