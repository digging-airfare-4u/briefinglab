export type NormalizedContentKind = "tweet" | "podcast_episode" | "blog_post"

export type NormalizedContent = {
  sourceKey: string
  creatorExternalId: string
  creatorDisplayName: string
  creatorHandle?: string
  creatorBio?: string
  creatorProfileUrl?: string
  kind: NormalizedContentKind
  externalId: string
  title?: string | null
  url: string
  publishedAt: string
  plainText?: string
  transcriptText?: string
  metrics?: {
    likes?: number
    shares?: number
    replies?: number
    views?: number
  }
  rawPayload: Record<string, unknown>
}
