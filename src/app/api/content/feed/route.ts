import { getPublicFeed } from "@/modules/content/public-content.service"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category") ?? undefined
  const cursor = searchParams.get("cursor") ?? undefined
  const limit = searchParams.get("limit")
  const source = searchParams.get("source") ?? undefined

  const payload = await getPublicFeed({
    category:
      category === "all" || category === "article" || category === "news"
        ? category
        : undefined,
    cursor,
    limit: limit ? Number(limit) : undefined,
    source,
  })

  return Response.json(payload)
}
