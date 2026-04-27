import { notFound } from "next/navigation"

import { DetailModal } from "@/components/site/detail-modal"
import { DetailPreview } from "@/components/site/detail-preview"
import { getContentDetailPageData } from "@/modules/content/public-content.adapter"

export const revalidate = 300

export default async function ContentDetailModalPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getContentDetailPageData(slug)

  if (!data) {
    notFound()
  }

  return (
    <DetailModal title={data.item.title}>
      <DetailPreview item={data.item} />
    </DetailModal>
  )
}
