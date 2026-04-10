import { runFollowBuildersIngestJob } from "@/modules/ingest/follow-builders.job"
import { runSummaryJobs } from "@/modules/summaries/summary.job"

export const maxDuration = 300

function formatJobError(error: unknown) {
  return {
    error: error instanceof Error ? error.message : String(error),
  }
}

export async function GET() {
  // In production, re-add `request: Request` and verify the cron secret if configured.
  // const cronSecret = process.env.CRON_SECRET
  // const vercelHeader = request.headers.get("x-vercel-signature")
  // if (cronSecret && vercelHeader !== cronSecret) {
  //   return Response.json({ message: "Unauthorized" }, { status: 401 })
  // }

  try {
    let ingest: Awaited<ReturnType<typeof runFollowBuildersIngestJob>> | ReturnType<typeof formatJobError>
    let summary: Awaited<ReturnType<typeof runSummaryJobs>> | ReturnType<typeof formatJobError>

    try {
      ingest = await runFollowBuildersIngestJob({ dryRun: false })
    } catch (error) {
      ingest = formatJobError(error)
    }

    try {
      summary = await runSummaryJobs()
    } catch (error) {
      summary = formatJobError(error)
    }

    return Response.json({
      timestamp: new Date().toISOString(),
      ingest,
      summary,
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
