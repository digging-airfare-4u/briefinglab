export type SourceType = "x_account" | "podcast" | "blog" | "upstream_feed"

export type SourceSeed = {
  key: string
  type: SourceType
  name: string
  homepageUrl?: string
  externalHandle?: string
  description?: string
  avatarUrl?: string
  config: Record<string, unknown>
}

export const defaultSources: SourceSeed[] = [
  {
    key: "follow-builders-feed",
    type: "upstream_feed",
    name: "Follow Builders Public Feed",
    homepageUrl: "https://github.com/zarazhangrui/follow-builders",
    description:
      "聚合公开的 X、播客和博客名单，用来扩展我长期跟踪的 builder 来源。",
    avatarUrl: "https://unavatar.io/github/zarazhangrui",
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
    description: "重点跟踪模型训练、推理和 AI 工程实践的一手动态。",
    avatarUrl: "https://unavatar.io/x/karpathy",
    config: {},
  },
  {
    key: "podcast-latent-space",
    type: "podcast",
    name: "Latent Space",
    homepageUrl: "https://www.youtube.com/@LatentSpacePod",
    description:
      "补充更长篇的对话和访谈，方便我做播客摘要与观点提炼。",
    avatarUrl: "https://unavatar.io/youtube/LatentSpacePod",
    config: {},
  },
  {
    key: "blog-sebastian-raschka",
    type: "blog",
    name: "Sebastian Raschka",
    homepageUrl: "https://sebastianraschka.com",
    description: "跟踪开源实验、训练细节和面向工程实践的技术长文。",
    avatarUrl: "https://unavatar.io/https://sebastianraschka.com",
    config: {},
  },
]
