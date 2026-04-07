import { DateGroupHeading } from "@/components/site/date-group-heading"
import {
  DigestContentCard,
  StandardContentCard,
} from "@/components/site/content-card"
import { SiteHeader } from "@/components/site/site-header"
import { getLatestPageData } from "@/modules/content/public-content.adapter"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function LatestPage() {
  const { groups } = await getLatestPageData()

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

        {groups.map((group) => (
          <section key={group.key} className="space-y-4">
            <DateGroupHeading label={group.label} count={group.items.length} />
            <div className="grid gap-4 md:grid-cols-2">
              {group.items.map((item) =>
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
        ))}
      </main>
    </div>
  )
}
