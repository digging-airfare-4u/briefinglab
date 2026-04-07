import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { createSupabaseContentRepository } from "@/modules/content/supabase-content.repository"
import { seedDefaultSources } from "@/modules/sources/source-seed"

async function main() {
  const repository = createSupabaseContentRepository(getSupabaseAdminClient())
  const result = await seedDefaultSources(repository)

  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
