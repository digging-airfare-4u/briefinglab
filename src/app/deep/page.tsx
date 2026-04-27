import { DeepPageClient } from "@/components/site/deep-page-client"
import { SiteHeader } from "@/components/site/site-header"
import { getDeepPageData } from "@/modules/content/public-content.adapter"
import { Badge } from "@/components/ui/badge"

export const revalidate = 300

export default async function DeepPage() {
  const data = await getDeepPageData()

  return (
    <div className="min-h-screen">
      <SiteHeader activeNav="deep" />
      <main className="app-shell space-y-8 pb-20 pt-8">
        <section className="border-b border-border/70 pb-4">
          <Badge className="rounded-full bg-primary/8 text-primary hover:bg-primary/8">
            深度内容
          </Badge>
          <h1 className="mt-4 font-heading text-3xl tracking-tight text-foreground">
            只留下更值得花时间的内容
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            这里优先看摘要卡、播客、博客和观点型内容，节奏更像编辑精选。
          </p>
        </section>

        <DeepPageClient
          initialItems={data.items}
          initialCursor={data.nextCursor}
          initialHasMore={data.hasMore}
        />
      </main>
    </div>
  )
}
