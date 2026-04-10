import { runSummaryJobs } from "@/modules/summaries/summary.job"

export const maxDuration = 60

export async function GET(request: Request) {
  const token = request.headers.get("x-internal-token")
  const expected = process.env.INTERNAL_API_TOKEN

  if (!expected || token !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const summary = await runSummaryJobs({ limit: 5 })

    return Response.json({
      timestamp: new Date().toISOString(),
      summary,
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
