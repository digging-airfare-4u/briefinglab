import { runFollowBuildersIngestJob } from "@/modules/ingest/follow-builders.job"
import { runSummaryJob } from "@/modules/summaries/summary.job"

export async function GET(request: Request) {
  // Vercel Cron adds a special header for verification
  const vercelHeader = request.headers.get("x-vercel-signature")

  // In production, verify the cron secret if configured
  // const cronSecret = process.env.CRON_SECRET
  // if (cronSecret && vercelHeader !== cronSecret) {
  //   return Response.json({ message: "Unauthorized" }, { status: 401 })
  // }

  try {
    const results = await Promise.allSettled([
      runFollowBuildersIngestJob({ dryRun: false }),
      runSummaryJob(),
    ])

    const ingestResult = results[0]
    const summaryResult = results[1]

    return Response.json({
      timestamp: new Date().toISOString(),
      ingest: ingestResult.status === "fulfilled" ? ingestResult.value : { error: ingestResult.reason },
      summary: summaryResult.status === "fulfilled" ? summaryResult.value : { error: summaryResult.reason },
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
