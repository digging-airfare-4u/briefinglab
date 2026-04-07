import { authorizeInternalRequest } from "@/modules/internal/internal-job-auth"
import { runSummaryJobs } from "@/modules/summaries/summary.job"

export async function POST(request: Request) {
  const unauthorized = authorizeInternalRequest(request)

  if (unauthorized) {
    return unauthorized
  }

  const body = (await request.json().catch(() => null)) as
    | { limit?: number }
    | null

  const payload = await runSummaryJobs({
    limit:
      typeof body?.limit === "number" && Number.isFinite(body.limit)
        ? body.limit
        : undefined,
  })

  return Response.json(payload)
}
