import { slugifySegment } from "@/modules/ingest/normalize"
import type { NormalizedContent } from "@/modules/ingest/types"

export type FollowBuildersTweet = {
  id: string
  text: string
  createdAt: string
  url: string
  likes?: number
  retweets?: number
  replies?: number
  views?: number
} & Record<string, unknown>

export type FollowBuildersXAuthor = {
  source?: "x"
  name: string
  handle: string
  bio?: string
  tweets: FollowBuildersTweet[]
} & Record<string, unknown>

export type FollowBuildersPodcastItem = {
  source?: "podcast"
  name: string
  title?: string
  guid?: string
  id?: string
  url: string
  publishedAt?: string
  createdAt?: string
  transcript?: string
  transcriptText?: string
  description?: string
  content?: string
} & Record<string, unknown>

export type FollowBuildersBlogItem = {
  source?: "blog"
  name: string
  title?: string
  guid?: string
  id?: string
  url: string
  publishedAt?: string
  createdAt?: string
  content?: string
  description?: string
  html?: string
} & Record<string, unknown>

export type FollowBuildersFeeds = {
  x: FollowBuildersXAuthor[]
  podcasts: FollowBuildersPodcastItem[]
  blogs: FollowBuildersBlogItem[]
}

export const DEFAULT_FOLLOW_BUILDERS_FEED_URLS = {
  x: "https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-x.json",
  podcasts:
    "https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-podcasts.json",
  blogs:
    "https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-blogs.json",
}

function buildCreatorKey(prefix: string, value: string) {
  return `${prefix}-${slugifySegment(value)}`
}

function asRecord<T extends Record<string, unknown>>(value: T) {
  return value
}

export function mapTweetFeedItem(
  author: Pick<FollowBuildersXAuthor, "name" | "handle" | "bio">,
  tweet: FollowBuildersTweet
): NormalizedContent {
  const handle = author.handle.toLowerCase()

  return {
    sourceKey: `x-${handle}`,
    creatorExternalId: handle,
    creatorDisplayName: author.name,
    creatorHandle: author.handle,
    creatorBio: author.bio ?? "",
    creatorProfileUrl: `https://x.com/${author.handle}`,
    kind: "tweet",
    externalId: String(tweet.id),
    title: null,
    url: tweet.url,
    publishedAt: tweet.createdAt,
    plainText: tweet.text,
    rawPayload: asRecord(tweet),
    metrics: {
      likes: tweet.likes ?? 0,
      shares: tweet.retweets ?? 0,
      replies: tweet.replies ?? 0,
      views: tweet.views,
    },
  }
}

export function mapPodcastFeedItem(
  item: FollowBuildersPodcastItem
): NormalizedContent {
  const creatorKey = buildCreatorKey("podcast", item.name)
  const externalId = item.guid ?? item.id ?? item.url

  return {
    sourceKey: creatorKey,
    creatorExternalId: creatorKey,
    creatorDisplayName: item.name,
    creatorProfileUrl: item.url,
    kind: "podcast_episode",
    externalId,
    title: item.title ?? null,
    url: item.url,
    publishedAt: item.publishedAt ?? item.createdAt ?? new Date(0).toISOString(),
    plainText: item.description ?? item.content ?? item.title,
    transcriptText: item.transcript ?? item.transcriptText,
    rawPayload: asRecord(item),
  }
}

export function mapBlogFeedItem(item: FollowBuildersBlogItem): NormalizedContent {
  const creatorKey = buildCreatorKey("blog", item.name)
  const externalId = item.id ?? item.guid ?? item.url

  return {
    sourceKey: creatorKey,
    creatorExternalId: creatorKey,
    creatorDisplayName: item.name,
    creatorProfileUrl: item.url,
    kind: "blog_post",
    externalId,
    title: item.title ?? null,
    url: item.url,
    publishedAt: item.publishedAt ?? item.createdAt ?? new Date(0).toISOString(),
    plainText: item.content ?? item.description,
    rawPayload: asRecord(item),
  }
}

export function normalizeFollowBuildersFeeds(
  feeds: FollowBuildersFeeds
): NormalizedContent[] {
  const tweetItems = feeds.x.flatMap((author) =>
    author.tweets.map((tweet) => mapTweetFeedItem(author, tweet))
  )
  const podcastItems = feeds.podcasts.map(mapPodcastFeedItem)
  const blogItems = feeds.blogs.map(mapBlogFeedItem)

  return [...tweetItems, ...podcastItems, ...blogItems]
}

export async function fetchFollowBuildersFeeds(
  urls = DEFAULT_FOLLOW_BUILDERS_FEED_URLS
): Promise<FollowBuildersFeeds> {
  const [xResponse, podcastsResponse, blogsResponse] = await Promise.all([
    fetch(urls.x),
    fetch(urls.podcasts),
    fetch(urls.blogs),
  ])

  const [xPayload, podcastsPayload, blogsPayload] = await Promise.all([
    xResponse.json() as Promise<{ x?: FollowBuildersXAuthor[] }>,
    podcastsResponse.json() as Promise<{ podcasts?: FollowBuildersPodcastItem[] }>,
    blogsResponse.json() as Promise<{ blogs?: FollowBuildersBlogItem[] }>,
  ])

  return {
    x: xPayload.x ?? [],
    podcasts: podcastsPayload.podcasts ?? [],
    blogs: blogsPayload.blogs ?? [],
  }
}
