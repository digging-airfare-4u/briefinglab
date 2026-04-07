import { describe, expect, it } from "vitest"

import {
  createSupabaseContentRepository,
  type SupabaseLikeClient,
} from "@/modules/content/supabase-content.repository"

function createFakeSupabaseClient() {
  const operations: Array<{
    table: string
    method: string
    payload?: unknown
    options?: unknown
    filters?: Array<{ column: string; value: string }>
  }> = []

  const sourceRow = { id: "source-1" }
  const creatorRow = { id: "creator-1" }
  const contentItemRow = { id: "content-1" }

  const client: SupabaseLikeClient = {
    from(table) {
      return {
        select() {
          return this
        },
        upsert(payload, options) {
          operations.push({ table, method: "upsert", payload, options })
          return {
            select() {
              return {
                async single() {
                  if (table === "sources") return { data: sourceRow, error: null }
                  if (table === "creators") return { data: creatorRow, error: null }
                  if (table === "content_items") {
                    return { data: contentItemRow, error: null }
                  }
                  return { data: null, error: null }
                },
              }
            },
          }
        },
        insert(payload) {
          operations.push({ table, method: "insert", payload })
          return {
            select() {
              return {
                async single() {
                  return { data: { id: "run-1" }, error: null }
                },
              }
            },
          }
        },
        update(payload) {
          operations.push({ table, method: "update", payload, filters: [] })
          return {
            eq(column, value) {
              const last = operations.at(-1)
              if (last?.filters) {
                last.filters.push({ column, value })
              }
              return Promise.resolve({ error: null })
            },
          }
        },
      }
    },
  }

  return { client, operations }
}

describe("supabase content repository", () => {
  it("writes sources, creators, content items, bodies, metrics and runs in order", async () => {
    const { client, operations } = createFakeSupabaseClient()
    const repository = createSupabaseContentRepository(client)

    const runId = await repository.createRun("follow-builders-feed")
    const source = await repository.upsertSource({
      key: "x-karpathy",
      type: "x_account",
      name: "Andrej Karpathy",
      homepageUrl: "https://x.com/karpathy",
      externalHandle: "karpathy",
      config: {},
    })
    const creator = await repository.upsertCreator({
      sourceId: source.id,
      externalId: "karpathy",
      displayName: "Andrej Karpathy",
      handle: "karpathy",
      bio: "bio",
      profileUrl: "https://x.com/karpathy",
    })
    const contentItem = await repository.upsertContentItem({
      sourceId: source.id,
      creatorId: creator.id,
      externalId: "1",
      kind: "tweet",
      title: null,
      slug: "tweet-1",
      url: "https://x.com/karpathy/status/1",
      publishedAt: "2026-04-05T14:58:44.000Z",
      language: "en",
      status: "published",
      rawPayload: { id: "1" },
    })
    await repository.upsertContentBody({
      contentItemId: contentItem.id,
      plainText: "hello world",
    })
    await repository.upsertContentMetrics({
      contentItemId: contentItem.id,
      likes: 1,
      shares: 2,
      replies: 3,
    })
    await repository.finishRun(runId, {
      status: "completed",
      stats: { items: 1 },
    })

    expect(operations.map((item) => `${item.table}:${item.method}`)).toEqual([
      "ingest_runs:insert",
      "sources:upsert",
      "creators:upsert",
      "content_items:upsert",
      "content_bodies:upsert",
      "content_metrics:upsert",
      "ingest_runs:update",
    ])
  })
})
