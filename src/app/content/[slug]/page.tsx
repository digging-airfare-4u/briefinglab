import { notFound } from "next/navigation"

import { DetailPage } from "@/components/site/detail-page"
import { getContentDetailPageData } from "@/modules/content/public-content.adapter"

export const revalidate = 300

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getContentDetailPageData(slug)

  if (!data) {
    notFound()
  }

  return <DetailPage item={data.item} relatedItems={data.relatedItems} />
}
