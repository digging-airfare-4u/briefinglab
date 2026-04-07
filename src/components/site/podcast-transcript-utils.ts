export type PodcastTranscriptSegment = {
  start: string
  end?: string
  speaker?: string
  body: string
}

export type TranscriptTabValue = "translation" | "original"

export function makeTranscriptAnchorId(
  start: string,
  tab: TranscriptTabValue
) {
  return `${tab}-transcript-${start.replace(/:/g, "-")}`
}

export function parsePodcastTranscript(
  text?: string | null
): PodcastTranscriptSegment[] {
  if (!text) {
    return []
  }

  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
  const pattern =
    /^(?:([^|]+?)\s*\|\s*)?(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)(?:\s+(.*))?$/
  const segments: PodcastTranscriptSegment[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const match = line?.match(pattern)

    if (!match) {
      continue
    }

    const [, speakerRaw, start, end, bodyRaw] = match
    let body = bodyRaw?.trim() ?? ""

    if (!body) {
      const nextLine = lines[index + 1]
      if (nextLine && !pattern.test(nextLine)) {
        body = nextLine
        index += 1
      }
    }

    if (!body) {
      continue
    }

    segments.push({
      start,
      end,
      speaker: speakerRaw?.trim() || undefined,
      body,
    })
  }

  return segments
}
