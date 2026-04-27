import { HomePageClient } from "@/components/site/home-page-client"
import { getHomePageData } from "@/modules/content/public-content.adapter"

export const revalidate = 300

export default async function Home() {
  const data = await getHomePageData()

  return (
    <HomePageClient
      initialItems={data.items}
      categories={data.categories}
      sources={data.sources}
      dailySummaries={data.dailySummaries}
      initialCursor={data.nextCursor}
      initialHasMore={data.hasMore}
    />
  )
}
