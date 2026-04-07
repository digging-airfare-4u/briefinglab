import { randomUUID } from "node:crypto"

import type { SourceType } from "@/modules/sources/default-sources"
import type { NormalizedContentKind } from "@/modules/ingest/types"

export type SourceRecord = {
  id: string
  key: string
  type: SourceType
  name: string
  homepageUrl?: string
  externalHandle?: string
  config: Record<string, unknown>
}

export type CreatorRecord = {
  id: string
  sourceId: string
  externalId: string
  displayName: string
  handle?: string
  bio?: string
  profileUrl?: string
}

export type ContentItemRecord = {
  id: string
  sourceId: string
  creatorId?: string
  externalId: string
  kind: NormalizedContentKind
  title?: string | null
  slug: string
  url: string
  publishedAt: string
  language: string
  status: string
  rawPayload: Record<string, unknown>
}

export type ContentBodyRecord = {
  contentItemId: string
  plainText?: string
  transcriptText?: string
}

export type ContentMetricsRecord = {
  contentItemId: string
  likes: number
  shares: number
  replies: number
  views?: number
}

export type IngestRunRecord = {
  id: string
  providerKey: string
  status: "running" | "completed" | "failed"
  startedAt: string
  finishedAt?: string
  stats: Record<string, unknown>
  errorText?: string
}

export interface ContentRepository {
  createRun(providerKey: string): Promise<string>
  finishRun(
    runId: string,
    result: {
      status: IngestRunRecord["status"]
      stats?: Record<string, unknown>
      errorText?: string
    }
  ): Promise<void>
  upsertSource(source: Omit<SourceRecord, "id">): Promise<SourceRecord>
  upsertCreator(
    creator: Omit<CreatorRecord, "id">
  ): Promise<CreatorRecord>
  upsertContentItem(
    item: Omit<ContentItemRecord, "id">
  ): Promise<ContentItemRecord>
  upsertContentBody(body: ContentBodyRecord): Promise<ContentBodyRecord>
  upsertContentMetrics(
    metrics: ContentMetricsRecord
  ): Promise<ContentMetricsRecord>
}

type Snapshot = {
  runs: IngestRunRecord[]
  sources: SourceRecord[]
  creators: CreatorRecord[]
  contentItems: ContentItemRecord[]
  contentBodies: ContentBodyRecord[]
  contentMetrics: ContentMetricsRecord[]
}

export function createInMemoryContentRepository(): ContentRepository & {
  snapshot(): Snapshot
} {
  const runs: IngestRunRecord[] = []
  const sources: SourceRecord[] = []
  const creators: CreatorRecord[] = []
  const contentItems: ContentItemRecord[] = []
  const contentBodies: ContentBodyRecord[] = []
  const contentMetrics: ContentMetricsRecord[] = []

  return {
    async createRun(providerKey) {
      const run: IngestRunRecord = {
        id: randomUUID(),
        providerKey,
        status: "running",
        startedAt: new Date().toISOString(),
        stats: {},
      }
      runs.push(run)
      return run.id
    },
    async finishRun(runId, result) {
      const run = runs.find((item) => item.id === runId)
      if (!run) {
        throw new Error(`Unknown ingest run: ${runId}`)
      }

      run.status = result.status
      run.stats = result.stats ?? {}
      run.errorText = result.errorText
      run.finishedAt = new Date().toISOString()
    },
    async upsertSource(source) {
      const existing = sources.find((item) => item.key === source.key)
      if (existing) {
        Object.assign(existing, source)
        return existing
      }

      const next: SourceRecord = {
        id: randomUUID(),
        ...source,
      }
      sources.push(next)
      return next
    },
    async upsertCreator(creator) {
      const existing = creators.find(
        (item) =>
          item.sourceId === creator.sourceId &&
          item.externalId === creator.externalId
      )
      if (existing) {
        Object.assign(existing, creator)
        return existing
      }

      const next: CreatorRecord = {
        id: randomUUID(),
        ...creator,
      }
      creators.push(next)
      return next
    },
    async upsertContentItem(item) {
      const existing = contentItems.find(
        (content) =>
          content.sourceId === item.sourceId &&
          content.externalId === item.externalId
      )
      if (existing) {
        Object.assign(existing, item)
        return existing
      }

      const next: ContentItemRecord = {
        id: randomUUID(),
        ...item,
      }
      contentItems.push(next)
      return next
    },
    async upsertContentBody(body) {
      const existing = contentBodies.find(
        (item) => item.contentItemId === body.contentItemId
      )
      if (existing) {
        Object.assign(existing, body)
        return existing
      }

      contentBodies.push(body)
      return body
    },
    async upsertContentMetrics(metrics) {
      const existing = contentMetrics.find(
        (item) => item.contentItemId === metrics.contentItemId
      )
      if (existing) {
        Object.assign(existing, metrics)
        return existing
      }

      contentMetrics.push(metrics)
      return metrics
    },
    snapshot() {
      return {
        runs: [...runs],
        sources: [...sources],
        creators: [...creators],
        contentItems: [...contentItems],
        contentBodies: [...contentBodies],
        contentMetrics: [...contentMetrics],
      }
    },
  }
}
