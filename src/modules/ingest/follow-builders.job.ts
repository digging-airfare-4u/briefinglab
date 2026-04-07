import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { createInMemoryContentRepository } from "@/modules/content/content.repository"
import { createSupabaseContentRepository } from "@/modules/content/supabase-content.repository"
import { IngestService } from "@/modules/ingest/ingest.service"
import {
  fetchFollowBuildersFeeds,
  normalizeFollowBuildersFeeds,
} from "@/modules/ingest/providers/follow-builders.provider"
import { sampleFollowBuildersFeeds } from "@/modules/ingest/providers/follow-builders.sample"

async function loadFeeds(isDryRun: boolean) {
  return fetchFollowBuildersFeeds().catch((error) => {
    if (!isDryRun) {
      throw error
    }

    console.warn(
      `Remote feed fetch failed in dry-run, falling back to sample data: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
    return sampleFollowBuildersFeeds
  })
}

export async function runFollowBuildersIngestJob({
  dryRun = false,
}: {
  dryRun?: boolean
} = {}) {
  if (!dryRun) {
    const repository = createSupabaseContentRepository(getSupabaseAdminClient())
    const service = new IngestService(repository)
    const runId = await service.startRun("follow-builders-feed")
    const feeds = await loadFeeds(false)
    const items = normalizeFollowBuildersFeeds(feeds)

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
  const runId = await service.startRun("follow-builders-feed")
  const feeds = await loadFeeds(true)
  const items = normalizeFollowBuildersFeeds(feeds)

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
