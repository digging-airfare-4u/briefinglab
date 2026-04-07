import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import {
  parseNormalizedContentArray,
  runDirectIngestJob,
} from "@/modules/ingest/direct-ingest.job"

function getArgValue(flag: string) {
  const entry = process.argv.find((item) => item.startsWith(`${flag}=`))
  return entry ? entry.slice(flag.length + 1) : undefined
}

async function main() {
  const file = getArgValue("--file")

  if (!file) {
    throw new Error("Missing required flag: --file=/absolute/or/relative/path.json")
  }

  const payload = JSON.parse(
    readFileSync(resolve(process.cwd(), file), "utf8")
  ) as unknown
  const items = parseNormalizedContentArray(
    Array.isArray(payload) ? payload : (payload as { items?: unknown }).items
  )

  if (!items) {
    throw new Error("Direct ingest payload must contain a valid items array")
  }

  const result = await runDirectIngestJob({
    items,
    providerKey: getArgValue("--provider-key") ?? "direct-ingest",
    dryRun: process.argv.includes("--dry-run"),
  })

  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
