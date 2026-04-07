import { runFollowBuildersIngestJob } from "@/modules/ingest/follow-builders.job"

async function main() {
  const result = await runFollowBuildersIngestJob({
    dryRun: process.argv.includes("--dry-run"),
  })

  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
