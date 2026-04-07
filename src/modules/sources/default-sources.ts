export type SourceType = "x_account" | "podcast" | "blog" | "upstream_feed"

export type SourceSeed = {
  key: string
  type: SourceType
  name: string
  homepageUrl?: string
  externalHandle?: string
  config: Record<string, unknown>
}

export const defaultSources: SourceSeed[] = [
  {
    key: "follow-builders-feed",
    type: "upstream_feed",
    name: "Follow Builders Public Feed",
    homepageUrl: "https://github.com/zarazhangrui/follow-builders",
    config: {
      feedXUrl:
        "https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-x.json",
      feedPodcastsUrl:
        "https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-podcasts.json",
      feedBlogsUrl:
        "https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-blogs.json",
    },
  },
  {
    key: "x-karpathy",
    type: "x_account",
    name: "Andrej Karpathy",
    homepageUrl: "https://x.com/karpathy",
    externalHandle: "karpathy",
    config: {},
  },
  {
    key: "podcast-latent-space",
    type: "podcast",
    name: "Latent Space",
    homepageUrl: "https://www.youtube.com/@LatentSpacePod",
    config: {},
  },
  {
    key: "blog-sebastian-raschka",
    type: "blog",
    name: "Sebastian Raschka",
    homepageUrl: "https://sebastianraschka.com",
    config: {},
  },
]
