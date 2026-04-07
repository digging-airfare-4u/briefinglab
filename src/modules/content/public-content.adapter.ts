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

function toContentListItem(item: PublicFeedItem): ContentListItem {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title ?? "",
    excerpt: item.excerpt,
    summary: item.summary.text,
    bullets: item.summary.bullets,
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
}> {
  const items = (await listPublicFeedItems()).map(toContentListItem)

  return {
    items,
    categories: buildCategoryOptions(items),
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
