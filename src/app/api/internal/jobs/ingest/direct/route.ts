import {
  parseNormalizedContentArray,
  runDirectIngestJob,
} from "@/modules/ingest/direct-ingest.job"
import { authorizeInternalRequest } from "@/modules/internal/internal-job-auth"

export async function POST(request: Request) {
  const unauthorized = authorizeInternalRequest(request)

  if (unauthorized) {
    return unauthorized
  }

  const body = (await request.json().catch(() => null)) as
    | {
        items?: unknown
        providerKey?: string
        dryRun?: boolean
      }
    | null
  const items = parseNormalizedContentArray(body?.items)

  if (!items) {
    return Response.json(
      { message: "Request body must include a valid items array" },
      { status: 400 }
    )
  }

  const payload = await runDirectIngestJob({
    items,
    providerKey:
      typeof body?.providerKey === "string" && body.providerKey.length > 0
        ? body.providerKey
        : "direct-ingest",
    dryRun: body?.dryRun === true,
  })

  return Response.json(payload)
}
