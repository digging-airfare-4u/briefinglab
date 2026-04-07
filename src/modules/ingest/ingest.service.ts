import { buildSlug } from "@/modules/ingest/normalize"
import type { NormalizedContent } from "@/modules/ingest/types"
import type { ContentRepository } from "@/modules/content/content.repository"
import { SourceService } from "@/modules/sources/source.service"

export class IngestService {
  constructor(
    private readonly repository: ContentRepository,
    private readonly sourceService = new SourceService()
  ) {}

  async startRun(providerKey: string) {
    return this.repository.createRun(providerKey)
  }

  async persistItems(runId: string, items: NormalizedContent[]) {
    let processed = 0

    try {
      for (const item of items) {
        const sourceSeed = this.sourceService.resolveForIngest(item)
        const source = await this.repository.upsertSource({
          key: sourceSeed.key,
          type: sourceSeed.type,
          name: sourceSeed.name,
          homepageUrl: sourceSeed.homepageUrl,
          externalHandle: sourceSeed.externalHandle,
          config: sourceSeed.config,
        })

        const creator = await this.repository.upsertCreator({
          sourceId: source.id,
          externalId: item.creatorExternalId,
          displayName: item.creatorDisplayName,
          handle: item.creatorHandle,
          bio: item.creatorBio,
          profileUrl: item.creatorProfileUrl,
        })

        const contentItem = await this.repository.upsertContentItem({
          sourceId: source.id,
          creatorId: creator.id,
          externalId: item.externalId,
          kind: item.kind,
          title: item.title,
          slug: buildSlug(item.kind, item.externalId),
          url: item.url,
          publishedAt: item.publishedAt,
          language: "en",
          status: "published",
          rawPayload: item.rawPayload,
        })

        if (item.plainText || item.transcriptText) {
          await this.repository.upsertContentBody({
            contentItemId: contentItem.id,
            plainText: item.plainText,
            transcriptText: item.transcriptText,
          })
        }

        if (item.metrics) {
          await this.repository.upsertContentMetrics({
            contentItemId: contentItem.id,
            likes: item.metrics.likes ?? 0,
            shares: item.metrics.shares ?? 0,
            replies: item.metrics.replies ?? 0,
            views: item.metrics.views,
          })
        }

        processed += 1
      }
    } catch (error) {
      await this.repository.finishRun(runId, {
        status: "failed",
        stats: { processed },
        errorText: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async finishRun(runId: string, stats: Record<string, unknown>) {
    await this.repository.finishRun(runId, {
      status: "completed",
      stats,
    })
  }
}
