import type { ContentRepository } from "@/modules/content/content.repository"
import type {
  ContentBodyRecord,
  ContentItemRecord,
  ContentMetricsRecord,
  CreatorRecord,
  SourceRecord,
} from "@/modules/content/content.repository"

type QueryResult<T> = PromiseLike<{
  data: T | null
  error: { message: string } | null
}>

type SelectSingleBuilder<T> = {
  select(): {
    single(): QueryResult<T>
  }
}

type UpdateBuilder = {
  eq(column: string, value: string): PromiseLike<{ error: { message: string } | null }>
}

type TableClient = {
  upsert(payload: unknown, options?: unknown): SelectSingleBuilder<{
    id: string
  }>
  insert(payload: unknown): SelectSingleBuilder<{
    id: string
  }>
  update(payload: unknown): UpdateBuilder
}

export type SupabaseLikeClient = {
  from(table: string): TableClient
}

function assertNoError(error: { message: string } | null, table: string, method: string) {
  if (error) {
    throw new Error(`${table} ${method} failed: ${error.message}`)
  }
}

export function createSupabaseContentRepository(
  client: SupabaseLikeClient
): ContentRepository {
  return {
    async createRun(providerKey) {
      const { data, error } = await client
        .from("ingest_runs")
        .insert({
          provider_key: providerKey,
          status: "running",
          stats: {},
        })
        .select()
        .single()

      assertNoError(error, "ingest_runs", "insert")

      if (!data) {
        throw new Error("ingest_runs insert returned no data")
      }

      return data.id
    },
    async finishRun(runId, result) {
      const { error } = await client.from("ingest_runs").update({
        status: result.status,
        stats: result.stats ?? {},
        error_text: result.errorText ?? null,
        finished_at: new Date().toISOString(),
      }).eq("id", runId)

      assertNoError(error, "ingest_runs", "update")
    },
    async upsertSource(source) {
      const { data, error } = await client
        .from("sources")
        .upsert(
          {
            key: source.key,
            type: source.type,
            name: source.name,
            homepage_url: source.homepageUrl ?? null,
            external_handle: source.externalHandle ?? null,
            config: source.config,
          },
          { onConflict: "key" }
        )
        .select()
        .single()

      assertNoError(error, "sources", "upsert")

      if (!data) {
        throw new Error("sources upsert returned no data")
      }

      return {
        id: data.id,
        ...source,
      } satisfies SourceRecord
    },
    async upsertCreator(creator) {
      const { data, error } = await client
        .from("creators")
        .upsert(
          {
            source_id: creator.sourceId,
            external_id: creator.externalId,
            display_name: creator.displayName,
            handle: creator.handle ?? null,
            bio: creator.bio ?? null,
            profile_url: creator.profileUrl ?? null,
            raw_payload: {},
          },
          { onConflict: "source_id,external_id" }
        )
        .select()
        .single()

      assertNoError(error, "creators", "upsert")

      if (!data) {
        throw new Error("creators upsert returned no data")
      }

      return {
        id: data.id,
        ...creator,
      } satisfies CreatorRecord
    },
    async upsertContentItem(item) {
      const { data, error } = await client
        .from("content_items")
        .upsert(
          {
            source_id: item.sourceId,
            creator_id: item.creatorId ?? null,
            external_id: item.externalId,
            kind: item.kind,
            title: item.title ?? null,
            slug: item.slug,
            url: item.url,
            published_at: item.publishedAt,
            language: item.language,
            status: item.status,
            raw_payload: item.rawPayload,
          },
          { onConflict: "source_id,external_id" }
        )
        .select()
        .single()

      assertNoError(error, "content_items", "upsert")

      if (!data) {
        throw new Error("content_items upsert returned no data")
      }

      return {
        id: data.id,
        ...item,
      } satisfies ContentItemRecord
    },
    async upsertContentBody(body) {
      const { error } = await client
        .from("content_bodies")
        .upsert(
          {
            content_item_id: body.contentItemId,
            plain_text: body.plainText ?? null,
            transcript_text: body.transcriptText ?? null,
          },
          { onConflict: "content_item_id" }
        )
        .select()
        .single()

      assertNoError(error, "content_bodies", "upsert")

      return body satisfies ContentBodyRecord
    },
    async upsertContentMetrics(metrics) {
      const { error } = await client
        .from("content_metrics")
        .upsert(
          {
            content_item_id: metrics.contentItemId,
            likes: metrics.likes,
            shares: metrics.shares,
            replies: metrics.replies,
            views: metrics.views ?? null,
          },
          { onConflict: "content_item_id" }
        )
        .select()
        .single()

      assertNoError(error, "content_metrics", "upsert")

      return metrics satisfies ContentMetricsRecord
    },
  }
}
