import {
  DigestContentCard,
  StandardContentCard,
} from "@/components/site/content-card"
import { SiteHeader } from "@/components/site/site-header"
import { getDeepPageData } from "@/modules/content/public-content.adapter"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export const dynamic = "force-dynamic"

export default async function DeepPage() {
  const { leadItem, items } = await getDeepPageData()

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

        {leadItem ? <DigestContentCard item={leadItem} /> : null}

        <section className="space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
              延伸阅读
            </h2>
            <Separator className="flex-1" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) =>
              item.cardType === "digest" ? (
                <div key={item.slug} className="md:col-span-2">
                  <DigestContentCard item={item} />
                </div>
              ) : (
                <StandardContentCard key={item.slug} item={item} />
              )
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
