import { describe, expect, it } from "vitest"

import { createInMemoryContentRepository } from "@/modules/content/content.repository"
import { defaultSources } from "@/modules/sources/default-sources"
import { seedDefaultSources } from "@/modules/sources/source-seed"

describe("source seed", () => {
  it("upserts the default source catalog idempotently", async () => {
    const repository = createInMemoryContentRepository()

    await seedDefaultSources(repository)
    await seedDefaultSources(repository)

    const snapshot = repository.snapshot()

    expect(snapshot.sources).toHaveLength(defaultSources.length)
    expect(snapshot.sources.map((item) => item.key).sort()).toEqual(
      defaultSources.map((item) => item.key).sort()
    )
  })
})
