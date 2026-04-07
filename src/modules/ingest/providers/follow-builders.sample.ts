import type { FollowBuildersFeeds } from "@/modules/ingest/providers/follow-builders.provider"

export const sampleFollowBuildersFeeds: FollowBuildersFeeds = {
  x: [
    {
      source: "x",
      name: "Andrej Karpathy",
      handle: "karpathy",
      bio: "I like to train large deep neural nets.",
      tweets: [
        {
          id: "2040806346556428585",
          text: "hello world",
          createdAt: "2026-04-05T14:58:44.000Z",
          url: "https://x.com/karpathy/status/2040806346556428585",
          likes: 479,
          retweets: 15,
          replies: 69,
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
}
