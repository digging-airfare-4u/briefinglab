import { runFollowBuildersIngestJob } from "@/modules/ingest/follow-builders.job"

export const maxDuration = 60

function formatJobError(error: unknown) {
  return {
    error: error instanceof Error ? error.message : String(error),
  }
}

function fireSummaryJob() {
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : null

  if (!baseUrl || !process.env.INTERNAL_API_TOKEN) {
    console.warn("Cannot chain summary job: missing VERCEL_URL or INTERNAL_API_TOKEN")
    return
  }

  // Fire-and-forget: don't await so we return the ingest response immediately
  fetch(`${baseUrl}/api/cron/summary`, {
    headers: { "x-internal-token": process.env.INTERNAL_API_TOKEN },
  }).catch((err) => {
    console.error("Failed to trigger summary job:", err)
  })
}

export async function GET() {
  try {
    let ingest: Awaited<ReturnType<typeof runFollowBuildersIngestJob>> | ReturnType<typeof formatJobError>

    try {
      ingest = await runFollowBuildersIngestJob({ dryRun: false })
    } catch (error) {
      ingest = formatJobError(error)
    }

    // Chain: trigger summary as a separate function invocation
    fireSummaryJob()

    return Response.json({
      timestamp: new Date().toISOString(),
      ingest,
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
