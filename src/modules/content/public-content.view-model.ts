export type ContentCategory = "news" | "article"
export type CategoryFilter = "all" | ContentCategory
export type CardType = "standard" | "digest"
export type ContentKind = "tweet" | "podcast_episode" | "blog_post"

export type ContentTimelineItem = {
  start: string
  end?: string
  title: string
  speaker?: string
}

export type ContentListItem = {
  id: string
  slug: string
  kind?: ContentKind
  title: string
  contentUrl?: string
  excerpt: string
  summary: string
  bullets: string[]
  hasSummary: boolean
  editorialTake?: string
  category: ContentCategory
  cardType: CardType
  sourceName: string
  sourceUrl: string
  creatorName: string
  creatorHandle: string
  publishedAt: string
  readTime: string
  badges?: string[]
}

export type ContentDetailItem = ContentListItem & {
  sourceLanguage: string
  duration?: string
  timeline?: ContentTimelineItem[]
  originalTitle?: string
  translatedTitle?: string
  originalText?: string
  translatedText?: string
  englishSummary?: string
  englishBullets?: string[]
}

export type ContentGroup = {
  key: string
  label: string
  items: ContentListItem[]
}

export type CategoryOption = {
  id: CategoryFilter
  label: string
  description: string
  count: number
}

const weekDayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]

const categoryBlueprints: Array<Omit<CategoryOption, "count">> = [
  { id: "all", label: "全部内容", description: "今日所有 AI 动向" },
  { id: "article", label: "文章", description: "播客、博客、日报与长文解读" },
  { id: "news", label: "动态", description: "X 快讯、发布与行业变化" },
]

export function formatDateGroup(dateString: string) {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekDayLabels[date.getDay()]}`
}

export function formatTime(dateString: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}

export function getCategoryCounts(items: ContentListItem[]) {
  return categoryBlueprints.reduce<Record<CategoryFilter, number>>(
    (accumulator, category) => {
      accumulator[category.id] =
        category.id === "all"
          ? items.length
          : items.filter((item) => item.category === category.id).length
      return accumulator
    },
    {
      all: 0,
      article: 0,
      news: 0,
    }
  )
}

export function buildCategoryOptions(items: ContentListItem[]): CategoryOption[] {
  const counts = getCategoryCounts(items)

  return categoryBlueprints.map((category) => ({
    ...category,
    count: counts[category.id],
  }))
}

export function filterContentItems(
  items: ContentListItem[],
  category: CategoryFilter
) {
  return category === "all"
    ? items
    : items.filter((item) => item.category === category)
}

export function groupContentItems(items: ContentListItem[]): ContentGroup[] {
  const groups = new Map<string, ContentListItem[]>()

  for (const item of items) {
    const key = item.publishedAt.slice(0, 10)
    groups.set(key, [...(groups.get(key) ?? []), item])
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => (left < right ? 1 : -1))
    .map(([key, group]) => ({
      key,
      label: formatDateGroup(group[0].publishedAt),
      items: [...group].sort((left, right) =>
        left.publishedAt < right.publishedAt ? 1 : -1
      ),
    }))
}
