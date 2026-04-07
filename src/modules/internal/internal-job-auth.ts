import { getInternalApiToken } from "@/config/env"

export function authorizeInternalRequest(request: Request) {
  try {
    const expectedToken = getInternalApiToken()
    const providedToken = request.headers.get("x-internal-token")

    if (!providedToken || providedToken !== expectedToken) {
      return Response.json({ message: "Unauthorized" }, { status: 401 })
    }

    return null
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Internal auth failed",
      },
      { status: 500 }
    )
  }
}
