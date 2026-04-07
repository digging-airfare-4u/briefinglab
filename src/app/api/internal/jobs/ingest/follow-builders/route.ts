import { authorizeInternalRequest } from "@/modules/internal/internal-job-auth"
import { runFollowBuildersIngestJob } from "@/modules/ingest/follow-builders.job"

export async function POST(request: Request) {
  const unauthorized = authorizeInternalRequest(request)

  if (unauthorized) {
    return unauthorized
  }

  const body = (await request.json().catch(() => null)) as
    | { dryRun?: boolean }
    | null

  const payload = await runFollowBuildersIngestJob({
    dryRun: body?.dryRun === true,
  })

  return Response.json(payload)
}
