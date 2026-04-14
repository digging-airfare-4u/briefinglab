import { describe, expect, it } from "vitest"

import { createSupabaseSummaryRepository } from "@/modules/summaries/summary.repository"

function isoAtMinute(minute: number) {
  return new Date(Date.UTC(2026, 3, 1, 0, minute, 0)).toISOString()
}

function makeSummaryRow(index: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `content-${index}`,
    slug: `tweet-${index}`,
    kind: "tweet",
    title: null,
    url: `https://x.com/example/status/${index}`,
    published_at: isoAtMinute(index),
    language: "en",
    raw_payload: {
      text: `Agents update ${index}.`,
    },
    creators: {
      display_name: "Example Author",
      handle: "example",
      profile_url: "https://x.com/example",
    },
    sources: {
      name: "X / Example Author",
      homepage_url: "https://x.com/example",
    },
    content_bodies: {
      plain_text: `Agents update ${index}.`,
      transcript_text: null,
    },
    content_summaries: [
      { locale: "zh" },
      { locale: "en" },
    ],
    content_translations: [{ locale: "zh" }],
    ...overrides,
  }
}

function createFakeSummaryClient(rows: Array<Record<string, unknown>>) {
  const calls: Array<{ from: number; to: number }> = []
  const client: Parameters<typeof createSupabaseSummaryRepository>[0] = {
    from() {
      return {
        select() {
          return {
            order(_column, options) {
              return {
                async range(from, to) {
                  calls.push({ from, to })
                  const sorted = [...rows].sort((left, right) => {
                    const leftValue = String(left.published_at)
                    const rightValue = String(right.published_at)
                    return options.ascending
                      ? leftValue.localeCompare(rightValue)
                      : rightValue.localeCompare(leftValue)
                  })

                  return {
                    data: sorted.slice(from, to + 1),
                    error: null,
                  }
                },
              }
            },
            async single() {
              return {
                data: null,
                error: null,
              }
            },
          }
        },
        upsert() {
          return {
            select() {
              return {
                async single() {
                  return {
                    data: { id: "summary-1" },
                    error: null,
                  }
                },
              }
            },
          }
        },
      }
    },
  }

  return { client, calls }
}

describe("summary repository", () => {
  it("scans past the first page so older pending items are not skipped", async () => {
    const rows = Array.from({ length: 205 }, (_, index) => makeSummaryRow(index))
    rows[200] = makeSummaryRow(200, {
      content_summaries: [],
      content_translations: [],
    })
    rows[201] = makeSummaryRow(201, {
      content_summaries: [],
      content_translations: [],
    })
    rows[202] = makeSummaryRow(202, {
      content_summaries: [],
      content_translations: [],
    })

    const { client, calls } = createFakeSummaryClient(rows)
    const repository = createSupabaseSummaryRepository(client)

    const pending = await repository.listPendingSummaryInputs(2)

    expect(calls).toEqual([
      { from: 0, to: 199 },
      { from: 200, to: 399 },
    ])
    expect(pending.map((item) => item.slug)).toEqual([
      "tweet-200",
      "tweet-201",
    ])
  })
})
