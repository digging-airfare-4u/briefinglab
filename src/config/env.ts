const requiredKeys = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const

export type RequiredEnv = Record<(typeof requiredKeys)[number], string>
export type OptionalLlmEnv = {
  baseUrl: string
  apiKey: string
  model: string
}

export function getRequiredEnv(): RequiredEnv {
  const result = {} as RequiredEnv

  for (const key of requiredKeys) {
    const value = process.env[key]
    if (!value) {
      throw new Error(`Missing env: ${key}`)
    }
    result[key] = value
  }

  return result
}

export function getInternalApiToken() {
  const value = process.env.INTERNAL_API_TOKEN

  if (!value) {
    throw new Error("Missing env: INTERNAL_API_TOKEN")
  }

  return value
}

function getFirstEnvValue(keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]

    if (value) {
      return value
    }
  }

  return null
}

export function getOptionalLlmEnv(): OptionalLlmEnv | null {
  const baseUrl = getFirstEnvValue(["LLM_BASE_URL", "OPENAI_BASE_URL"])
  const apiKey = getFirstEnvValue(["LLM_API_KEY", "OPENAI_API_KEY"])
  const model = getFirstEnvValue(["LLM_MODEL", "OPENAI_MODEL"])

  if (!baseUrl && !apiKey && !model) {
    return null
  }

  if (!baseUrl || !apiKey || !model) {
    throw new Error(
      "Incomplete LLM configuration: expected LLM_BASE_URL/LLM_API_KEY/LLM_MODEL"
    )
  }

  return {
    baseUrl,
    apiKey,
    model,
  }
}
