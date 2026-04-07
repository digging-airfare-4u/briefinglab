import { afterEach, describe, expect, it, vi } from "vitest"

import { getInternalApiToken, getRequiredEnv } from "@/config/env"

describe("env", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("returns required supabase keys", () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")

    expect(getRequiredEnv().SUPABASE_URL).toBe("https://example.supabase.co")
    expect(getRequiredEnv().SUPABASE_SERVICE_ROLE_KEY).toBe("service-role-key")
  })

  it("throws when a required env is missing", () => {
    vi.stubEnv("SUPABASE_URL", "")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")

    expect(() => getRequiredEnv()).toThrow("Missing env: SUPABASE_URL")
  })

  it("returns the internal api token", () => {
    vi.stubEnv("INTERNAL_API_TOKEN", "local-dev-token")

    expect(getInternalApiToken()).toBe("local-dev-token")
  })
})
