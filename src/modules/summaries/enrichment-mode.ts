import { resolveDetailMode } from "@/modules/content/content-complexity"
import type { NormalizedContentKind } from "@/modules/ingest/types"

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function getFallbackText(input: {
  rawPayload: Record<string, unknown>
  plainText?: string
  transcriptText?: string
}) {
  const rawRecord = input.rawPayload
  const rawCandidates = [
    input.transcriptText,
    input.plainText,
    typeof rawRecord.text === "string" ? rawRecord.text : undefined,
    typeof rawRecord.description === "string" ? rawRecord.description : undefined,
    typeof rawRecord.content === "string" ? rawRecord.content : undefined,
    typeof rawRecord.html === "string" ? rawRecord.html : undefined,
  ]

  return rawCandidates.find(
    (candidate) => typeof candidate === "string" && cleanText(candidate).length > 0
  )
}

export type SummaryEnrichmentMode = "compact" | "deep"

export function resolveSummaryEnrichmentMode(input: {
  kind: NormalizedContentKind
  rawPayload: Record<string, unknown>
  plainText?: string
  transcriptText?: string
}): SummaryEnrichmentMode {
  const sourceText = getFallbackText(input)

  return resolveDetailMode({
    kind: input.kind,
    originalText: sourceText,
  })
}
