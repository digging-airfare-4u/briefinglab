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

type SummaryJobResult = Awaited<ReturnType<SummaryService["runPending"]>> & {
  warnings: string[]
}

function pushWarning(warnings: string[], message: string) {
  if (!warnings.includes(message)) {
    warnings.push(message)
  }

  console.warn(message)
}

function createDefaultSummaryGenerator(): {
  generator: SummaryGenerator
  warnings: string[]
} {
  const llmEnv = getOptionalLlmEnv()
  const fallback = createHeuristicSummaryGenerator()
  const warnings: string[] = []

  if (!llmEnv) {
    pushWarning(
      warnings,
      "LLM configuration missing; summary jobs will fall back to heuristic summaries without full-text Chinese translations."
    )

    return {
      generator: fallback,
      warnings,
    }
  }

  const primary = createOpenAICompatibleSummaryGenerator(llmEnv)

  return {
    warnings,
    generator: {
      async generate(input) {
        try {
          return await primary.generate(input)
        } catch (error) {
          pushWarning(
            warnings,
            `LLM enrichment failed for ${input.slug}, falling back to heuristic summaries: ${
              error instanceof Error ? error.message : String(error)
            }`
          )
          return fallback.generate(input)
        }
      },
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
} = {}): Promise<SummaryJobResult> {
  const defaultGenerator = generator ? null : createDefaultSummaryGenerator()
  const summaryRepository =
    repository ?? createSupabaseSummaryRepository(getSupabaseAdminClient())
  const service = new SummaryService(
    summaryRepository,
    generator ?? defaultGenerator?.generator ?? createHeuristicSummaryGenerator()
  )

  const result = await service.runPending({ limit })

  return {
    ...result,
    warnings: [...(defaultGenerator?.warnings ?? [])],
  }
}
