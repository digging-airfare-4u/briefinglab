import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

describe("schema smoke", () => {
  it("documents required public tables in the initial migration", () => {
    const migrationPath = resolve(
      process.cwd(),
      "supabase/migrations/20260406213000_init_builder_digest.sql"
    )
    const migration = readFileSync(migrationPath, "utf8")

    const requiredTables = [
      "sources",
      "creators",
      "content_items",
      "content_bodies",
      "content_metrics",
      "content_summaries",
      "content_translations",
      "ingest_runs",
    ]

    for (const table of requiredTables) {
      expect(migration).toContain(`create table public.${table}`)
    }

    expect(migration).toContain("create extension if not exists pgcrypto;")
    expect(migration).toContain(
      "create index idx_content_items_kind_published_at on public.content_items"
    )
  })
})
