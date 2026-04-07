import { getOptionalLlmEnv } from "@/config/env"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import {
  createSupabaseSummaryRepository,
  type SummaryRepository,
} from "@/modules/summaries/summary.repository"
import { createOpenAICompatibleSummaryGenerator } from "@/modules/summaries/openai-compatible-summary-generator"
import {
  createHeuristicSummaryGenerator,
  SummaryService,
  type SummaryGenerator,
} from "@/modules/summaries/summary.service"

function createDefaultSummaryGenerator(): SummaryGenerator {
  const llmEnv = getOptionalLlmEnv()
  const fallback = createHeuristicSummaryGenerator()

  if (!llmEnv) {
    return fallback
  }

  const primary = createOpenAICompatibleSummaryGenerator(llmEnv)

  return {
    async generate(input) {
      try {
        return await primary.generate(input)
      } catch (error) {
        console.warn(
          `LLM enrichment failed for ${input.slug}, falling back to heuristic summaries: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
        return fallback.generate(input)
      }
    },
  }
}

export async function runSummaryJobs({
  limit = 20,
  repository,
  generator,
}: {
  limit?: number
  repository?: SummaryRepository
  generator?: SummaryGenerator
} = {}) {
  const summaryRepository =
    repository ?? createSupabaseSummaryRepository(getSupabaseAdminClient())
  const service = new SummaryService(
    summaryRepository,
    generator ?? createDefaultSummaryGenerator()
  )

  return service.runPending({ limit })
}
