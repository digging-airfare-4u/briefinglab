import { getPublicContentDetail } from "@/modules/content/public-content.service"

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const payload = await getPublicContentDetail(slug)

  if (!payload) {
    return Response.json({ message: "Content not found" }, { status: 404 })
  }

  return Response.json(payload)
}
