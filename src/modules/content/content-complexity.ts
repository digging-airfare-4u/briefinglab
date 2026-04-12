type ContentComplexityKind = "tweet" | "podcast_episode" | "blog_post"

export type ContentDetailMode = "compact" | "deep"

export function countParagraphs(...candidates: Array<string | undefined>) {
  const source = candidates.find(
    (candidate) => typeof candidate === "string" && candidate.trim().length > 0
  )

  if (!source) {
    return 0
  }

  return source
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean).length
}

export function resolveDetailMode(input: {
  kind?: ContentComplexityKind
  timelineLength?: number
  summary?: string
  originalText?: string
  translatedText?: string
}): ContentDetailMode {
  if (input.kind === "podcast_episode" || (input.timelineLength ?? 0) > 0) {
    return "deep"
  }

  const maxLength = Math.max(
    input.originalText?.trim().length ?? 0,
    input.translatedText?.trim().length ?? 0,
    input.summary?.trim().length ?? 0
  )
  const paragraphCount = countParagraphs(input.originalText, input.translatedText)

  return maxLength <= 320 && paragraphCount <= 2 ? "compact" : "deep"
}
