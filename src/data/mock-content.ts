export type FeedCategory = "news" | "article"
export type CategoryFilter = "all" | FeedCategory
export type CardType = "standard" | "digest"

export type FeedItem = {
  slug: string
  title: string
  excerpt: string
  summary: string
  bullets: string[]
  editorialTake?: string
  category: FeedCategory
  cardType: CardType
  sourceName: string
  sourceUrl: string
  creatorName: string
  creatorHandle: string
  publishedAt: string
  readTime: string
  featured?: boolean
  badges?: string[]
}

export const categoryOptions: Array<{
  id: CategoryFilter
  label: string
  description: string
}> = [
  { id: "all", label: "全部内容", description: "今日所有 AI 动向" },
  { id: "article", label: "文章", description: "播客、博客、日报与长文解读" },
  { id: "news", label: "动态", description: "X 快讯、发布与行业变化" },
]

export const feedItems: FeedItem[] = [
  {
    slug: "builder-digest-042",
    title: "Builder Digest #042: AI 编程从“写代码”进入“编排工作流”阶段",
    excerpt:
      "过去一周最值得注意的变化不是模型本身，而是 agent 工具链开始从单轮问答走向持续执行。",
    summary:
      "这期日报把最近一周最关键的 Builder 信号汇总到一起：模型能力还在稳步增强，但真正开始改变团队生产方式的是长任务编排、上下文记忆和可验证执行链路。",
    bullets: [
      "AI 编程产品正在从单文件生成，转向跨文件、跨命令、跨任务的连续执行。",
      "团队开始更重视“可恢复执行”和“中途接管”，而不是一次性生成结果。",
      "摘要、引用、任务日志和审阅回路，正在变成 AI 产品的新标准层。",
    ],
    editorialTake:
      "如果你的产品只停留在 chat 输入框，它会很快显得不够专业。下一阶段的差异化，会来自任务结构和结果可信度。",
    category: "article",
    cardType: "digest",
    sourceName: "Builder Digest",
    sourceUrl: "https://example.com/builder-digest-042",
    creatorName: "caiji",
    creatorHandle: "@caiji",
    publishedAt: "2026-04-06T09:20:00+08:00",
    readTime: "5 分钟摘要",
    featured: true,
    badges: ["日报", "编辑精选"],
  },
  {
    slug: "anthropic-memory-boundary",
    title: "Anthropic 更新长期记忆安全边界研究，强调 agent 的上下文污染风险",
    excerpt:
      "研究重点不在模型记忆能力本身，而在持久化记忆如何被错误、恶意或低质量信息长期污染。",
    summary:
      "Anthropic 新研究重新强调 agent memory 的可信边界。结论不是“不要长期记忆”，而是长期记忆必须具备来源、过期策略和可审计性。",
    bullets: [
      "长期记忆一旦缺少来源标记，后续推理很难判断信息是否仍然有效。",
      "记忆系统需要区分用户偏好、任务上下文和事实性知识。",
      "对高价值记忆进行复核，比无差别扩大记忆窗口更重要。",
    ],
    editorialTake:
      "这类研究很适合放进产品设计层。未来高质量 AI 应用的竞争力，很可能来自“记住什么”和“忘掉什么”。",
    category: "article",
    cardType: "standard",
    sourceName: "Anthropic Research",
    sourceUrl: "https://example.com/anthropic-memory-boundary",
    creatorName: "Anthropic",
    creatorHandle: "@AnthropicAI",
    publishedAt: "2026-04-06T08:10:00+08:00",
    readTime: "4 分钟",
    featured: true,
    badges: ["长文"],
  },
  {
    slug: "vercel-ai-gateway-observability",
    title: "Vercel 为 AI Gateway 增加可观测性面板，开始强调成本与延迟的统一视图",
    excerpt:
      "从模型调用次数转向更可执行的运营指标，这对团队化使用 AI API 的产品很关键。",
    summary:
      "这次更新把调用成本、成功率、延迟和 provider 维度拉到同一张图里，说明 AI 基础设施产品正在从“接上模型”走向“可运营”。",
    bullets: [
      "团队需要按 provider、模型和路由策略查看调用表现。",
      "成本可视化开始影响产品与工程的默认决策。",
    ],
    category: "news",
    cardType: "standard",
    sourceName: "Vercel",
    sourceUrl: "https://example.com/vercel-ai-gateway-observability",
    creatorName: "Vercel",
    creatorHandle: "@vercel",
    publishedAt: "2026-04-06T07:35:00+08:00",
    readTime: "3 分钟",
    badges: ["更新"],
  },
  {
    slug: "cursor-team-context-sync",
    title: "Cursor 推出团队知识上下文同步，试图把个人 Copilot 变成团队工作层",
    excerpt:
      "当 AI 编程工具开始处理团队知识、规范和项目记忆时，产品定位就不再只是个人效率工具。",
    summary:
      "这次更新的重点是把团队规范、文档和近期改动融入编码上下文，让 AI 的建议更像项目成员而不是通用助手。",
    bullets: [
      "从个人补全工具转向团队工程界面，是 AI IDE 的自然演化。",
      "团队知识同步会直接影响建议质量与组织 adoption。",
    ],
    category: "news",
    cardType: "standard",
    sourceName: "Cursor",
    sourceUrl: "https://example.com/cursor-team-context-sync",
    creatorName: "Cursor",
    creatorHandle: "@cursor_ai",
    publishedAt: "2026-04-06T06:55:00+08:00",
    readTime: "3 分钟",
    badges: ["工程效率"],
  },
  {
    slug: "deepmind-sparse-activation",
    title: "DeepMind 论文讨论长上下文推理中的稀疏激活策略，目标是降低推理成本",
    excerpt:
      "核心思路是只在真正需要时激活更多计算路径，而不是为每一步都支付同样的推理代价。",
    summary:
      "论文讨论如何在长上下文场景下动态分配计算资源，使模型在保持效果的同时降低总体推理成本。",
    bullets: [
      "推理成本优化开始成为模型研究的重要主线。",
      "产品侧最终会感知为更快的长上下文体验和更稳定的成本结构。",
    ],
    category: "article",
    cardType: "standard",
    sourceName: "DeepMind",
    sourceUrl: "https://example.com/deepmind-sparse-activation",
    creatorName: "DeepMind",
    creatorHandle: "@GoogleDeepMind",
    publishedAt: "2026-04-05T21:40:00+08:00",
    readTime: "4 分钟",
    badges: ["论文"],
  },
  {
    slug: "ai-builder-briefing-product-signal",
    title: "AI Builder Briefing: 本周最强的产品信号，是“可信工作流”取代“酷炫生成”",
    excerpt:
      "如果把本周所有产品发布放在一起看，会发现大家都在把重点从效果演示切回稳定、审计和协作。",
    summary:
      "这份编辑摘要聚焦三个方向：任务可恢复、结果可验证、团队可协同。它们共同构成下一阶段 AI 产品的基础能力，而不是附加功能。",
    bullets: [
      "支持长任务恢复的产品，会比一次性出结果的产品更容易进入真实工作流。",
      "用户越来越在意“为什么这样做”，而不是只看答案本身。",
      "协作层和日志层正在成为 AI 产品的默认配置。",
    ],
    editorialTake:
      "真正高端的 AI 产品不会让用户惊叹一次，而是让用户安心地把工作交给它一整天。",
    category: "article",
    cardType: "digest",
    sourceName: "caiji Editorial",
    sourceUrl: "https://example.com/ai-builder-briefing",
    creatorName: "caiji",
    creatorHandle: "@caiji",
    publishedAt: "2026-04-05T18:30:00+08:00",
    readTime: "6 分钟摘要",
    featured: true,
    badges: ["深度", "观点"],
  },
  {
    slug: "perplexity-enterprise-research-mode",
    title: "Perplexity 推出企业级 Research Mode，把检索问答进一步做成可交付报告",
    excerpt:
      "越来越多产品不满足于“回答一个问题”，而是希望一步给出结构化产物。",
    summary:
      "Research Mode 的重点不只是搜索，而是把搜索结果组织为可继续编辑、可引用的产出，向工作产物进一步靠近。",
    bullets: [
      "从答案到报告，是 AI 产品价值感提升的一条重要路径。",
      "结构化引用会直接影响企业环境中的信任度。",
    ],
    category: "news",
    cardType: "standard",
    sourceName: "Perplexity",
    sourceUrl: "https://example.com/perplexity-enterprise-research-mode",
    creatorName: "Perplexity",
    creatorHandle: "@perplexity_ai",
    publishedAt: "2026-04-05T15:10:00+08:00",
    readTime: "3 分钟",
    badges: ["企业产品"],
  },
  {
    slug: "hugging-face-dataset-quality-tool",
    title: "Hugging Face 开源训练数据质量评估工具，帮助团队更快发现脏数据模式",
    excerpt:
      "数据工具的价值常常被低估，但它决定了很多模型与应用效果的天花板。",
    summary:
      "这次工具发布的意义在于把数据质量检查前置，让团队在训练前就能发现重复、污染和分布偏移问题。",
    bullets: [
      "高质量数据仍然是很多应用效果差距的根因。",
      "这类基础工具会持续提升开源训练工作流的成熟度。",
    ],
    category: "news",
    cardType: "standard",
    sourceName: "Hugging Face",
    sourceUrl: "https://example.com/hugging-face-dataset-quality-tool",
    creatorName: "Hugging Face",
    creatorHandle: "@huggingface",
    publishedAt: "2026-04-05T10:45:00+08:00",
    readTime: "2 分钟",
    badges: ["开源"],
  },
  {
    slug: "karpathy-personal-ai-stack",
    title: "Karpathy 分享个人 AI 工作台的新观察：真正稀缺的是压缩认知负担的界面",
    excerpt:
      "当工具越来越多，用户最需要的不再是更多能力，而是更少的切换成本。",
    summary:
      "Karpathy 的观察集中在界面层：好的 AI 产品不是把所有能力都端出来，而是帮用户压缩判断成本和操作路径。",
    bullets: [
      "上下文切换成本，是很多 AI 工具难以长期留存的真正原因。",
      "产品界面越高级，越像是在替用户组织复杂性，而不是展示复杂性。",
    ],
    category: "article",
    cardType: "standard",
    sourceName: "X / Andrej Karpathy",
    sourceUrl: "https://example.com/karpathy-personal-ai-stack",
    creatorName: "Andrej Karpathy",
    creatorHandle: "@karpathy",
    publishedAt: "2026-04-04T22:05:00+08:00",
    readTime: "4 分钟",
    badges: ["观点"],
  },
  {
    slug: "runway-video-agent-control",
    title: "Runway 开始测试更可控的视频 agent 工作流，尝试把提示词拆成镜头级操作",
    excerpt:
      "生成式视频产品正在从单次生成转向更加结构化的创作控制。",
    summary:
      "最新演示展示了把镜头分解、风格约束和迭代操作整合到单个工作区的方向，产品思路比纯粹提质更值得关注。",
    bullets: [
      "视频生成工具的关键竞争点正从“会不会生成”切向“能不能改”。",
      "结构化控制会提高专业用户的采用意愿。",
    ],
    category: "news",
    cardType: "standard",
    sourceName: "Runway",
    sourceUrl: "https://example.com/runway-video-agent-control",
    creatorName: "Runway",
    creatorHandle: "@runwayml",
    publishedAt: "2026-04-04T16:25:00+08:00",
    readTime: "3 分钟",
    badges: ["视频生成"],
  },
]

const weekDayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]

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

export function getCategoryCounts(items = feedItems) {
  return categoryOptions.reduce<Record<CategoryFilter, number>>(
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

export function filterFeedItems(category: CategoryFilter) {
  return category === "all"
    ? feedItems
    : feedItems.filter((item) => item.category === category)
}

export function groupFeedItems(items: FeedItem[]) {
  const groups = new Map<string, FeedItem[]>()

  for (const item of items) {
    const key = item.publishedAt.slice(0, 10)
    groups.set(key, [...(groups.get(key) ?? []), item])
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => (left < right ? 1 : -1))
    .map(([key, group]) => ({
      key,
      label: formatDateGroup(group[0].publishedAt),
      items: group.sort((left, right) =>
        left.publishedAt < right.publishedAt ? 1 : -1
      ),
    }))
}

export function getFeaturedItems() {
  return feedItems.filter((item) => item.featured).slice(0, 4)
}

export function getLatestItems() {
  return [...feedItems].sort((left, right) =>
    left.publishedAt < right.publishedAt ? 1 : -1
  )
}

export function getDeepItems() {
  return feedItems.filter(
    (item) => item.cardType === "digest" || item.category === "article"
  )
}

export function getItemBySlug(slug: string) {
  return feedItems.find((item) => item.slug === slug)
}

export function getRelatedItems(slug: string) {
  const currentItem = getItemBySlug(slug)
  if (!currentItem) {
    return []
  }

  return feedItems
    .filter(
      (item) =>
        item.slug !== slug &&
        (item.category === currentItem.category || item.featured)
    )
    .slice(0, 3)
}
