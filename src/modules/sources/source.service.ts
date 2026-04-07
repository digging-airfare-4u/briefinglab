import { defaultSources, type SourceSeed, type SourceType } from "@/modules/sources/default-sources"
import type { NormalizedContent } from "@/modules/ingest/types"

function inferSourceType(item: NormalizedContent): SourceType {
  switch (item.kind) {
    case "tweet":
      return "x_account"
    case "podcast_episode":
      return "podcast"
    case "blog_post":
      return "blog"
  }
}

export class SourceService {
  constructor(private readonly sources = defaultSources) {}

  list() {
    return this.sources
  }

  findByKey(key: string) {
    return this.sources.find((source) => source.key === key) ?? null
  }

  resolveForIngest(item: NormalizedContent): SourceSeed {
    const existing = this.findByKey(item.sourceKey)

    if (existing) {
      return existing
    }

    return {
      key: item.sourceKey,
      type: inferSourceType(item),
      name: item.creatorDisplayName,
      homepageUrl: item.creatorProfileUrl ?? item.url,
      externalHandle: item.creatorHandle,
      config: {},
    }
  }
}
