import { runSummaryJobs } from "@/modules/summaries/summary.job"

function getNumberArg(name: string) {
  const arg = process.argv.find((entry) => entry.startsWith(`--${name}=`))

  if (!arg) {
    return undefined
  }

  const value = Number(arg.slice(name.length + 3))
  return Number.isFinite(value) ? value : undefined
}

async function main() {
  const limit = getNumberArg("limit") ?? 20
  const maxBatches = getNumberArg("max-batches") ?? 6
  const batchResults: Array<
    Awaited<ReturnType<typeof runSummaryJobs>> & { batch: number }
  > = []

  for (let batch = 1; batch <= maxBatches; batch += 1) {
    const result = await runSummaryJobs({ limit })
    batchResults.push({
      batch,
      ...result,
    })

    if (result.processed === 0) {
      break
    }

    if (result.processed < limit) {
      break
    }

    if (result.created === 0 && result.failed > 0) {
      break
    }
  }

  const totals = batchResults.reduce(
    (accumulator, result) => {
      accumulator.processed += result.processed
      accumulator.created += result.created
      accumulator.failed += result.failed
      accumulator.warnings.push(...result.warnings)
      accumulator.errors.push(...result.errors)
      return accumulator
    },
    {
      processed: 0,
      created: 0,
      failed: 0,
      warnings: [] as string[],
      errors: [] as Array<{ contentItemId: string; message: string }>,
    }
  )

  console.log(
    JSON.stringify(
      {
        limit,
        maxBatches,
        batches: batchResults.length,
        totals: {
          ...totals,
          warnings: Array.from(new Set(totals.warnings)),
        },
        batchResults,
      },
      null,
      2
    )
  )

  if (totals.failed > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
