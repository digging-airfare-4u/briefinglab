## Context

项目目标不是做一个“功能很多的资讯站”，而是做一个看起来更干净、更高端、对技术用户更友好的 AI 内容聚合产品。它应该同时具备三种气质：

1. 像 `Hacker News` 一样有信息密度和技术可信度
2. 像“今日热榜”一样便于快速浏览和按类别切换
3. 像编辑型媒体一样有摘要、精选和节奏感

已有后端方案已经明确：Phase 1 先消费 `follow-builders` 的公开 feed，统一落入 Supabase，再通过服务端 API 提供给前端使用。

## Product Decisions

### 1. 首页采用三栏思路，但移动端自动降级

- 桌面端：顶部导航 + 左侧分类栏 + 中间内容流 + 右侧精选栏
- 平板端：顶部导航 + 中间内容流 + 可折叠筛选
- 移动端：顶部导航 + 抽屉菜单 + 单列内容流

这样做的原因是首页既要有“浏览效率”，又要有“产品感”和“编辑感”。右栏是实现这种气质的重要结构，不建议删除。

### 2. 内容详情页采用“摘要优先”

详情页不是原文搬运页，而是站内的二次阅读入口：

- 先看中文摘要和要点
- 再看关键信息与来源
- 最后跳转原文

这样更符合 AI 资讯聚合产品的价值定位，也更适合未来做“站内观点”和“精选深度内容”。

### 3. 前端先静态壳 + 假数据，后接真实 API

MVP 前端应先完成静态结构、视觉系统和组件体系，再接入真实 API。原因：

- 视觉层和信息层需要先稳定
- 后端 API 尚未完全落地
- 首页和详情页的产品节奏比数据库字段更值得先确定

因此前端数据层应抽象为 adapter，不要直接把页面耦合到 Supabase 表结构。

### 4. 前端组件基座必须是 shadcn/ui

所有通用组件优先建立在 `shadcn/ui` 和 Tailwind 变量体系之上，包括：

- `Card`
- `Button`
- `Badge`
- `Sheet`
- `Tabs`
- `Separator`
- `Skeleton`

允许做项目级封装，但不单独自建基础原子组件体系。

## Information Architecture

### Primary Routes

- `/`：首页，展示日期分组后的内容流和精选区
- `/latest`：偏快讯的最新内容流
- `/deep`：偏摘要型和长内容的精选页
- `/content/[slug]`：摘要优先的内容详情页
- `/about`：站点介绍、方法说明、数据来源说明

### Homepage Regions

#### Top Navigation

- 品牌名
- 核心导航：快讯、深度、关于
- 右侧操作：主题切换、订阅/关注按钮、移动端菜单按钮

#### Left Category Rail

- 全部内容
- 文章
- 动态

每个分类显示数量，支持 active 态，桌面端固定显示，移动端进入 `Sheet` 抽屉。

#### Main Feed

- 以日期分组展示内容，如“4月6日 周一”
- 每组下混排普通资讯卡与日报摘要卡
- 默认按发布时间倒序
- 支持分页或“加载更多”

#### Right Editorial Rail

- 今日精选
- AI 日报 / Builder Digest
- 可选的“值得深读”模块

## Data Model Mapping for Frontend

前端不直接暴露数据库术语，而是消费更稳定的 ViewModel：

```ts
type FeedItem = {
  id: string;
  slug: string;
  category: 'news' | 'article';
  cardType: 'standard' | 'digest';
  title: string | null;
  excerpt: string;
  summary?: {
    locale: 'zh' | 'en';
    text: string;
    bullets?: string[];
  };
  creator: {
    name: string;
    handle?: string;
  };
  source: {
    name: string;
    url: string;
  };
  publishedAt: string;
  badges?: string[];
};
```

当前阶段的分类映射规则固定为：

- `tweet`、快讯型发布、行业动态、产品更新统一映射到 `news`
- `podcast_episode`、`blog_post`、日报摘要、长文解读统一映射到 `article`

页面只依赖这个层，不感知 `content_items`、`content_bodies`、`content_summaries` 的底层拆分方式。

## Backend Boundary

### Public Layer

由服务端 API 提供给前端：

- feed 列表
- 分类筛选
- 内容详情
- 来源列表

### Internal Layer

仅供任务系统使用：

- 上游 feed ingest
- direct ingest
- summary jobs

前端和浏览器不得直接访问内容表，也不应持有 `service role key`。

## Visual Direction

### Design Principles

- 背景尽量轻，避免大面积纯白刺眼
- 卡片圆角适中，不做过度玻璃拟态
- 阴影轻柔，边界克制
- 字体与字号重视节奏，强调“可读性高于炫技”
- 颜色少而准，强调蓝灰或偏冷色科技感

### Suggested Token Direction

- Background: 偏暖灰白或冷白，不要死白
- Primary text: 深灰而非纯黑
- Accent: 一支主蓝 + 一支冷紫作为少量强调
- Radius: 中等圆角，保证现代感但不幼态

## Phasing

### Phase 1

- 产出高质量静态前端首页与详情页
- 建立设计 token、布局系统和组件封装
- 接入公共 feed API
- 跑通 follow-builders -> Supabase -> summary -> public API

### Phase 2

- 增加更完整的深度页和专题页
- 增加搜索、收藏、订阅
- 增加自有 provider 和更细分类
- 增加个性化推荐和相关内容

## Risks

- 如果首页做得太像普通博客，会损失产品辨识度
- 如果前端直接按数据库建模，会导致后续 API 和视图频繁返工
- 如果右栏和摘要体验不够强，会削弱“高端编辑型产品”的感觉
