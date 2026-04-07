import type { ContentRepository } from "@/modules/content/content.repository"
import { SourceService } from "@/modules/sources/source.service"

export async function seedDefaultSources(
  repository: Pick<ContentRepository, "upsertSource">,
  sourceService = new SourceService()
) {
  const sources = sourceService.list()

  for (const source of sources) {
    await repository.upsertSource({
      key: source.key,
      type: source.type,
      name: source.name,
      homepageUrl: source.homepageUrl,
      externalHandle: source.externalHandle,
      config: source.config,
    })
  }

  return {
    seeded: sources.length,
  }
}
