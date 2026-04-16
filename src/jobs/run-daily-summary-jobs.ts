import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { listPublicFeedItems } from "@/modules/content/public-content.service"
import { runDailySummaryJobs } from "@/modules/summaries/daily-summary.job"
import {
  createSupabaseDailySummaryRepository,
  type DailySummaryRepository,
} from "@/modules/summaries/daily-summary.repository"

function groupItemsByDate(items: Awaited<ReturnType<typeof listPublicFeedItems>>) {
  const groups: Record<string, typeof items> = {}
  for (const item of items) {
    const date = item.publishedAt.slice(0, 10)
    groups[date] = [...(groups[date] ?? []), item]
  }
  return groups
}

function getDatesArg() {
  const arg = process.argv.find((entry) => entry.startsWith("--dates="))
  if (!arg) return undefined
  return arg.slice("--dates=".length).split(",")
}

async function main() {
  const items = await listPublicFeedItems()
  const itemsByDate = groupItemsByDate(items)

  const repository: DailySummaryRepository = createSupabaseDailySummaryRepository(
    getSupabaseAdminClient() as unknown as Parameters<
      typeof createSupabaseDailySummaryRepository
    >[0]
  )

  const result = await runDailySummaryJobs({
    itemsByDate,
    repository,
    dates: getDatesArg(),
  })

  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
