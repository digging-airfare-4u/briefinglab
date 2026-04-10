import { afterEach, describe, expect, it, vi } from "vitest"

const mockState = vi.hoisted(() => {
  function createDeferred<T>() {
    let resolve!: (value: T) => void
    const promise = new Promise<T>((nextResolve) => {
      resolve = nextResolve
    })

    return { promise, resolve }
  }

  let ingestDeferred = createDeferred<{
    runId: string
    dryRun: boolean
    items: number
  }>()
  const events: string[] = []

  return {
    events,
    getIngestDeferred() {
      return ingestDeferred
    },
    reset() {
      events.length = 0
      ingestDeferred = createDeferred<{
        runId: string
        dryRun: boolean
        items: number
      }>()
    },
  }
})

vi.mock("@/modules/ingest/follow-builders.job", () => ({
  runFollowBuildersIngestJob: vi.fn(async () => {
    mockState.events.push("ingest:start")
    const result = await mockState.getIngestDeferred().promise
    mockState.events.push("ingest:end")
    return result
  }),
}))

vi.mock("@/modules/summaries/summary.job", () => ({
  runSummaryJobs: vi.fn(async () => {
    mockState.events.push("summary:start")
    return {
      processed: 2,
      created: 6,
      failed: 0,
      errors: [],
      warnings: [],
    }
  }),
}))

import { GET } from "@/app/api/cron/ingest/route"

describe("cron ingest route", () => {
  afterEach(() => {
    mockState.reset()
    vi.clearAllMocks()
  })

  it("waits for ingest to finish before running summary jobs", async () => {
    const responsePromise = GET(
      new Request("http://localhost:3000/api/cron/ingest", {
        method: "GET",
      })
    )

    await Promise.resolve()

    expect(mockState.events).toEqual(["ingest:start"])

    mockState.getIngestDeferred().resolve({
      runId: "ingest-run-1",
      dryRun: false,
      items: 3,
    })

    const response = await responsePromise
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mockState.events).toEqual([
      "ingest:start",
      "ingest:end",
      "summary:start",
    ])
    expect(payload.ingest.runId).toBe("ingest-run-1")
    expect(payload.summary.created).toBe(6)
  })
})
