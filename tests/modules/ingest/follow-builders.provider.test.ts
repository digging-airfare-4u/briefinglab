import { describe, expect, it } from "vitest"

import {
  mapPodcastFeedItem,
  mapTweetFeedItem,
  normalizeFollowBuildersFeeds,
} from "@/modules/ingest/providers/follow-builders.provider"

describe("follow-builders provider", () => {
  it("maps tweet feed item into normalized content", () => {
    const item = mapTweetFeedItem(
      { name: "Andrej Karpathy", handle: "karpathy", bio: "bio" },
      {
        id: "1",
        text: "hello world",
        createdAt: "2026-04-05T14:58:44.000Z",
        url: "https://x.com/karpathy/status/1",
        likes: 1,
        retweets: 2,
        replies: 3,
      }
    )

    expect(item.kind).toBe("tweet")
    expect(item.externalId).toBe("1")
    expect(item.sourceKey).toBe("x-karpathy")
    expect(item.metrics?.likes).toBe(1)
  })

  it("maps podcast feed item into normalized content", () => {
    const item = mapPodcastFeedItem({
      source: "podcast",
      name: "Latent Space",
      title:
        "Moonlake: Causal World Models should be Multimodal, Interactive, and Efficient",
      guid: "substack:post:192967759",
      url: "https://www.youtube.com/@LatentSpacePod",
      publishedAt: "2026-04-02T17:55:29.000Z",
      transcript: "Speaker 1 | 00:00 - 00:20",
    })

    expect(item.kind).toBe("podcast_episode")
    expect(item.externalId).toBe("substack:post:192967759")
    expect(item.transcriptText).toContain("Speaker 1")
  })

  it("normalizes tweet, podcast and blog feeds into one array", () => {
    const items = normalizeFollowBuildersFeeds({
      x: [
        {
          source: "x",
          name: "Andrej Karpathy",
          handle: "karpathy",
          bio: "bio",
          tweets: [
            {
              id: "1",
              text: "hello world",
              createdAt: "2026-04-05T14:58:44.000Z",
              url: "https://x.com/karpathy/status/1",
            },
          ],
        },
      ],
      podcasts: [
        {
          source: "podcast",
          name: "Latent Space",
          title: "Moonlake",
          guid: "pod-1",
          url: "https://www.youtube.com/@LatentSpacePod",
          publishedAt: "2026-04-02T17:55:29.000Z",
          transcript: "Speaker 1 | 00:00 - 00:20",
        },
      ],
      blogs: [
        {
          source: "blog",
          name: "Sebastian Raschka",
          title: "Why evals matter",
          url: "https://sebastianraschka.com/blog/evals",
          publishedAt: "2026-04-01T00:00:00.000Z",
          content: "blog body",
          id: "blog-1",
        },
      ],
    })

    expect(items).toHaveLength(3)
    expect(items.map((item) => item.kind)).toEqual([
      "tweet",
      "podcast_episode",
      "blog_post",
    ])
  })
})
