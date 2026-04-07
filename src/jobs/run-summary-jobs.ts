import { runSummaryJobs } from "@/modules/summaries/summary.job"

function getLimitArg() {
  const arg = process.argv.find((entry) => entry.startsWith("--limit="))

  if (!arg) {
    return undefined
  }

  const value = Number(arg.slice("--limit=".length))
  return Number.isFinite(value) ? value : undefined
}

async function main() {
  const result = await runSummaryJobs({
    limit: getLimitArg(),
  })

  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
