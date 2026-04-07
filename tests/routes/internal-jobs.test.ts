import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/modules/ingest/follow-builders.job", () => ({
  runFollowBuildersIngestJob: vi.fn(async () => ({
    runId: "ingest-run-1",
    dryRun: false,
    items: 3,
  })),
}))

vi.mock("@/modules/ingest/direct-ingest.job", async () => {
  const actual = await vi.importActual<typeof import("@/modules/ingest/direct-ingest.job")>(
    "@/modules/ingest/direct-ingest.job"
  )

  return {
    ...actual,
    runDirectIngestJob: vi.fn(async () => ({
      runId: "direct-run-1",
      dryRun: false,
      items: 1,
    })),
  }
})

vi.mock("@/modules/summaries/summary.job", () => ({
  runSummaryJobs: vi.fn(async () => ({
    processed: 2,
    created: 4,
    failed: 0,
    errors: [],
  })),
}))

import { POST as postDirectIngest } from "@/app/api/internal/jobs/ingest/direct/route"
import { POST as postFollowBuilders } from "@/app/api/internal/jobs/ingest/follow-builders/route"
import { POST as postSummaries } from "@/app/api/internal/jobs/summaries/route"

describe("internal jobs routes", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("rejects unauthorized internal requests", async () => {
    vi.stubEnv("INTERNAL_API_TOKEN", "local-dev-token")

    const response = await postFollowBuilders(
      new Request("http://localhost:3000/api/internal/jobs/ingest/follow-builders", {
        method: "POST",
      })
    )

    expect(response.status).toBe(401)
  })

  it("triggers follow-builders ingest when the internal token is valid", async () => {
    vi.stubEnv("INTERNAL_API_TOKEN", "local-dev-token")

    const response = await postFollowBuilders(
      new Request("http://localhost:3000/api/internal/jobs/ingest/follow-builders", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-token": "local-dev-token",
        },
        body: JSON.stringify({ dryRun: false }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.runId).toBe("ingest-run-1")
  })

  it("validates direct ingest payloads before triggering the job", async () => {
    vi.stubEnv("INTERNAL_API_TOKEN", "local-dev-token")

    const invalidResponse = await postDirectIngest(
      new Request("http://localhost:3000/api/internal/jobs/ingest/direct", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-token": "local-dev-token",
        },
        body: JSON.stringify({ items: [{ invalid: true }] }),
      })
    )

    expect(invalidResponse.status).toBe(400)

    const validResponse = await postDirectIngest(
      new Request("http://localhost:3000/api/internal/jobs/ingest/direct", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-token": "local-dev-token",
        },
        body: JSON.stringify({
          items: [
            {
              sourceKey: "x-karpathy",
              creatorExternalId: "karpathy",
              creatorDisplayName: "Andrej Karpathy",
              kind: "tweet",
              externalId: "1",
              title: null,
              url: "https://x.com/karpathy/status/1",
              publishedAt: "2026-04-05T14:58:44.000Z",
              plainText: "hello world",
              rawPayload: { id: "1" },
            },
          ],
        }),
      })
    )
    const payload = await validResponse.json()

    expect(validResponse.status).toBe(200)
    expect(payload.runId).toBe("direct-run-1")
  })

  it("triggers summary jobs with the same internal auth contract", async () => {
    vi.stubEnv("INTERNAL_API_TOKEN", "local-dev-token")

    const response = await postSummaries(
      new Request("http://localhost:3000/api/internal/jobs/summaries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-token": "local-dev-token",
        },
        body: JSON.stringify({ limit: 5 }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.processed).toBe(2)
    expect(payload.created).toBe(4)
  })
})
