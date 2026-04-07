import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { createInMemoryContentRepository } from "@/modules/content/content.repository"
import { createSupabaseContentRepository } from "@/modules/content/supabase-content.repository"
import { IngestService } from "@/modules/ingest/ingest.service"
import type { NormalizedContent } from "@/modules/ingest/types"

function isMetricsRecord(value: unknown) {
  return value === undefined || (typeof value === "object" && value !== null)
}

export function isNormalizedContent(value: unknown): value is NormalizedContent {
  if (!value || typeof value !== "object") {
    return false
  }

  const record = value as Record<string, unknown>

  return (
    typeof record.sourceKey === "string" &&
    typeof record.creatorExternalId === "string" &&
    typeof record.creatorDisplayName === "string" &&
    (record.creatorHandle === undefined || typeof record.creatorHandle === "string") &&
    (record.creatorBio === undefined || typeof record.creatorBio === "string") &&
    (record.creatorProfileUrl === undefined ||
      typeof record.creatorProfileUrl === "string") &&
    (record.kind === "tweet" ||
      record.kind === "podcast_episode" ||
      record.kind === "blog_post") &&
    typeof record.externalId === "string" &&
    (record.title === undefined ||
      record.title === null ||
      typeof record.title === "string") &&
    typeof record.url === "string" &&
    typeof record.publishedAt === "string" &&
    (record.plainText === undefined || typeof record.plainText === "string") &&
    (record.transcriptText === undefined ||
      typeof record.transcriptText === "string") &&
    isMetricsRecord(record.metrics) &&
    typeof record.rawPayload === "object" &&
    record.rawPayload !== null
  )
}

export function parseNormalizedContentArray(value: unknown) {
  if (!Array.isArray(value)) {
    return null
  }

  return value.every(isNormalizedContent) ? value : null
}

export async function runDirectIngestJob({
  items,
  providerKey = "direct-ingest",
  dryRun = false,
}: {
  items: NormalizedContent[]
  providerKey?: string
  dryRun?: boolean
}) {
  if (!dryRun) {
    const repository = createSupabaseContentRepository(getSupabaseAdminClient())
    const service = new IngestService(repository)
    const runId = await service.startRun(providerKey)

    await service.persistItems(runId, items)
    await service.finishRun(runId, { items: items.length, dryRun: false })

    return {
      runId,
      dryRun: false,
      items: items.length,
    }
  }

  const repository = createInMemoryContentRepository()
  const service = new IngestService(repository)
  const runId = await service.startRun(providerKey)

  await service.persistItems(runId, items)
  await service.finishRun(runId, { items: items.length, dryRun: true })

  const snapshot = repository.snapshot()

  return {
    runId,
    dryRun: true,
    items: items.length,
    sources: snapshot.sources.length,
    creators: snapshot.creators.length,
    contentItems: snapshot.contentItems.length,
    sample: snapshot.contentItems[0] ?? null,
  }
}
