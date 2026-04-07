import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { getRequiredEnv } from "@/config/env"

let cachedClient: SupabaseClient | null = null

export function createSupabaseAdminClient() {
  const env = getRequiredEnv()

  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}

export function getSupabaseAdminClient() {
  if (!cachedClient) {
    cachedClient = createSupabaseAdminClient()
  }

  return cachedClient
}
