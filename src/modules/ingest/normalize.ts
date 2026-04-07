export function slugifySegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function buildSlug(kind: string, externalId: string) {
  return slugifySegment(`${kind}-${externalId}`)
}
