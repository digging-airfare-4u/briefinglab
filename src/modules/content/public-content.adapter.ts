import {
  getPublicContentDetail,
  listPublicFeedItems,
  type PublicContentDetail,
  type PublicFeedItem,
} from "@/modules/content/public-content.service"
import {
  buildCategoryOptions,
  groupContentItems,
  type CategoryOption,
  type ContentDetailItem,
  type ContentGroup,
  type ContentListItem,
} from "@/modules/content/public-content.view-model"
import {
  listObservedSourceDirectoryItems,
  listSourceDirectoryItems,
  type SourceDirectoryItem,
} from "@/modules/sources/source-directory"

function toContentListItem(item: PublicFeedItem): ContentListItem {
  const legacyUrl =
    "url" in (item as PublicFeedItem & { url?: string })
      ? (item as PublicFeedItem & { url?: string }).url
      : undefined

  return {
    id: item.id,
    slug: item.slug,
    kind: item.kind,
    title: item.title ?? "",
    contentUrl: item.contentUrl ?? legacyUrl ?? item.source.url,
    excerpt: item.excerpt,
    summary: item.summary.text,
    bullets: item.summary.bullets,
    hasSummary: !item.summary.isFallback,
    editorialTake: item.editorialTake,
    category: item.category,
    cardType: item.cardType,
    sourceName: item.source.name,
    sourceUrl: item.source.url,
    creatorName: item.creator.name,
    creatorHandle: item.creator.handle ?? "",
    publishedAt: item.publishedAt,
    readTime: item.readTime,
    badges: item.badges,
  }
}

function toDetailPageData(item: PublicContentDetail) {
  const translation = item.body.translation
  const englishSummary = item.summaries.en

  return {
    item: {
      ...toContentListItem(item),
      sourceLanguage: item.body.original.locale,
      duration: item.duration,
      timeline: item.timeline,
      originalTitle: item.body.original.title ?? undefined,
      translatedTitle: translation?.title ?? undefined,
      originalText: item.body.original.text ?? undefined,
      translatedText: translation?.text ?? undefined,
      englishSummary: englishSummary?.summary ?? undefined,
      englishBullets: englishSummary?.bullets ?? [],
    } satisfies ContentDetailItem,
    relatedItems: item.relatedItems.map(toContentListItem),
  }
}

export async function getHomePageData(): Promise<{
  items: ContentListItem[]
  categories: CategoryOption[]
  sources: SourceDirectoryItem[]
}> {
  const items = (await listPublicFeedItems()).map(toContentListItem)
  const sources = listObservedSourceDirectoryItems(
    items.map((item) => ({
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      creatorHandle: item.creatorHandle,
      kind: item.kind,
    }))
  )

  return {
    items,
    categories: buildCategoryOptions(items),
    sources: sources.length > 0 ? sources : listSourceDirectoryItems(),
  }
}

export async function getLatestPageData(): Promise<{
  groups: ContentGroup[]
}> {
  const items = (await listPublicFeedItems()).map(toContentListItem)

  return {
    groups: groupContentItems(items),
  }
}

export async function getDeepPageData(): Promise<{
  leadItem: ContentListItem | null
  items: ContentListItem[]
}> {
  const items = (await listPublicFeedItems())
    .map(toContentListItem)
    .filter((item) => item.cardType === "digest" || item.category === "article")

  const [leadItem, ...rest] = items

  return {
    leadItem: leadItem ?? null,
    items: rest,
  }
}

export async function getContentDetailPageData(slug: string): Promise<{
  item: ContentDetailItem
  relatedItems: ContentListItem[]
} | null> {
  const item = await getPublicContentDetail(slug)

  return item ? toDetailPageData(item) : null
}
