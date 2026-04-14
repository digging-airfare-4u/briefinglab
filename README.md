# Briefinglab · 采集

> A clean, summary-first AI news aggregator — surfacing what builders are building, thinking, and shipping.

[English](#english) · [中文](#中文)

---

## English

### What is Briefinglab?

Briefinglab is an AI-native content aggregation platform that surfaces high-signal posts, podcasts, and articles from influential builders. It normalizes content from diverse sources into a unified feed, generates bilingual (EN/ZH) summaries, and delivers a distraction-free reading experience.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, Radix UI |
| Backend | Next.js API Routes, Supabase Edge Functions |
| Database | Supabase Postgres (with RLS) |
| Auth | Supabase Auth |
| Ingest | Node.js jobs (`tsx`), LLM-powered summarization |
| Deployment | Vercel (frontend + functions), Supabase (database), GitHub Actions (scheduled jobs) |

### Features

- **Unified feed** — Aggregates tweets, podcast episodes, and blog posts from followed builders
- **AI summaries** — Bilingual (EN/ZH) bullet-point summaries generated via LLM
- **Translation** — Full original-text + translated-text for non-Chinese content
- **Categories** — Filter by: All / Articles / News
- **Dark mode** — Light theme by default, dark mode ready
- **Responsive** — Mobile-first, works across devices

### Quick Start (Local Dev)

#### Prerequisites

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- A Supabase project (local or cloud)

#### 1. Clone & Install

```bash
git clone https://github.com/digging-airfare-4u/briefinglab.git
cd caiji
npm install
```

#### 2. Set up Supabase

```bash
# Start local Supabase
supabase init
supabase start

# Run migrations
supabase db push

# Link to remote project (optional)
supabase link --project-ref <your-project-ref>
```

#### 3. Configure Environment

```bash
cp .env.example .env.local
```

Fill in your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# LLM (OpenAI-compatible)
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=<your-api-key>
LLM_MODEL=gpt-4o-mini

# Internal auth
INTERNAL_API_TOKEN=<any-random-string>
```

#### 4. Seed Sources

```bash
npm run seed:sources
```

#### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

#### 6. Run Ingest Jobs

```bash
# Dry-run the builder ingest
npm run ingest:follow-builders:dry-run

# Run actual ingest (fetches content, generates summaries)
npm run ingest:follow-builders

# Run direct ingest
npm run ingest:direct

# Generate summaries for existing content
npm run summaries:run
```

### One-Click Deploy

#### Vercel + Supabase

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/digging-airfare-4u/briefinglab)

[![Deploy to Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)](https://supabase.com)

**Steps:**

1. Create a [Supabase](https://supabase.com) project
2. Run the SQL migration in `supabase/migrations/20260406213000_init_builder_digest.sql` via Supabase Dashboard → SQL Editor
3. Deploy to Vercel (button above)
4. Add your Supabase + LLM environment variables in Vercel → Settings → Environment Variables
5. Visit your deployed site

#### Required Environment Variables (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=<your-api-key>
LLM_MODEL=gpt-4o-mini
INTERNAL_API_TOKEN=<any-random-string>
```

#### Scheduled Jobs (GitHub Actions)

Production scheduling is handled by GitHub Actions instead of Vercel Cron:

- `Ingest Content` — runs daily at `00:05 UTC`
- `Summarize Content` — runs every `30` minutes

Add these repository secrets in GitHub:

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
LLM_BASE_URL
LLM_API_KEY
LLM_MODEL
```

The workflows run these scripts directly:

```bash
npm run ingest:follow-builders
npm run summaries:drain -- --limit=20 --max-batches=6
```

### Database Schema

```
sources           — Content sources (X accounts, podcasts, blogs)
creators          — Individual creators per source
content_items     — Normalized content (tweets, episodes, posts)
content_bodies    — Full text, HTML, transcripts
content_metrics   — Engagement metrics (likes, shares, views)
content_summaries — LLM-generated summaries (EN/ZH)
content_translations — Full translations
ingest_runs       — Ingest job history & stats
```

### Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Home feed
│   ├── latest/           # Latest content
│   ├── deep/              # Deep reads (long-form)
│   ├── content/[slug]/   # Article detail pages
│   └── api/              # API routes
├── components/site/       # Site-specific UI components
├── components/ui/        # shadcn/ui primitives
├── modules/
│   ├── content/          # Content querying & view models
│   ├── ingest/            # Ingest pipeline
│   ├── sources/           # Source management
│   └── summaries/        # Summary generation
├── jobs/                 # Standalone ingest/summary scripts
└── lib/                  # Supabase client, utilities
supabase/
├── migrations/           # Postgres schema
└── seed.sql             # Initial seed data
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest tests |
| `npm run seed:sources` | Seed default sources |
| `npm run ingest:follow-builders` | Run builder feed ingest |
| `npm run ingest:direct` | Run direct content ingest |
| `npm run summaries:run` | Generate one summary batch |
| `npm run summaries:drain` | Drain multiple summary batches until backlog drops |

---

## 中文

### Briefinglab 是什么？

Briefinglab（采集）是一个 AI 优先的内容聚合平台，汇聚 Builder 群体的高价值推文、播客和博客文章。系统自动从多个来源抓取内容、生成中英文摘要，并以极简阅读体验呈现。

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16 (App Router), React 19, Tailwind CSS v4, Radix UI |
| 后端 | Next.js API Routes, Supabase Edge Functions |
| 数据库 | Supabase Postgres（含 RLS） |
| 认证 | Supabase Auth |
| 采集 | Node.js jobs (`tsx`)，LLM 摘要生成 |
| 部署 | Vercel（前端+函数），Supabase（数据库），GitHub Actions（定时任务） |

### 功能特性

- **统一信息流** — 聚合 X 推文、播客节目、博客文章
- **AI 摘要** — 中英文双语要点摘要（LLM 生成）
- **全文翻译** — 原文 + 中文翻译对照阅读
- **分类筛选** — 全部 / 文章 / 动态
- **暗色模式** — 默认亮色，支持暗色切换
- **响应式布局** — 移动端优先

### 本地开发

#### 前置依赖

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- 一个 Supabase 项目（本地或云端）

#### 1. 克隆安装

```bash
git clone https://github.com/digging-airfare-4u/briefinglab.git
cd caiji
npm install
```

#### 2. 初始化 Supabase

```bash
# 启动本地 Supabase
supabase init
supabase start

# 推送数据库迁移
supabase db push

# 关联远程项目（可选）
supabase link --project-ref <your-project-ref>
```

#### 3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# LLM（OpenAI 兼容接口）
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=<your-api-key>
LLM_MODEL=gpt-4o-mini

# 内部接口认证
INTERNAL_API_TOKEN=<任意随机字符串>
```

#### 4. 初始化数据源

```bash
npm run seed:sources
```

#### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

#### 6. 运行采集任务

```bash
# 模拟运行 Builder 采集（不写入数据）
npm run ingest:follow-builders:dry-run

# 实际运行采集（抓取内容 + 生成摘要）
npm run ingest:follow-builders

# 直接内容采集
npm run ingest:direct

# 为现有内容生成摘要
npm run summaries:run
```

### 一键部署

#### Vercel + Supabase

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/digging-airfare-4u/briefinglab)

[![Deploy to Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)](https://supabase.com)

**步骤：**

1. 创建 [Supabase](https://supabase.com) 项目
2. 在 Supabase Dashboard → SQL Editor 中执行 `supabase/migrations/20260406213000_init_builder_digest.sql`
3. 点击上方 Vercel 按钮部署
4. 在 Vercel → Settings → Environment Variables 中配置环境变量
5. 访问你的站点

#### 必需的环境变量（Vercel）

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=<your-api-key>
LLM_MODEL=gpt-4o-mini
INTERNAL_API_TOKEN=<任意随机字符串>
```

#### 定时任务（GitHub Actions）

生产环境的定时采集与摘要生成改由 GitHub Actions 执行，不再依赖 Vercel Cron：

- `Ingest Content`：每天 `00:05 UTC` 运行一次采集
- `Summarize Content`：每 `30` 分钟运行一次摘要补齐

需要在 GitHub 仓库的 Secrets 中配置：

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
LLM_BASE_URL
LLM_API_KEY
LLM_MODEL
```

工作流直接执行这些脚本：

```bash
npm run ingest:follow-builders
npm run summaries:drain -- --limit=20 --max-batches=6
```

### 数据库结构

```
sources           — 内容来源（X 账号、播客、博客）
creators          — 各来源下的创作者
content_items     — 标准化内容条目（推文、节目、文章）
content_bodies    — 完整正文、HTML、转写文本
content_metrics   — 互动数据（点赞、转发、阅读量）
content_summaries — LLM 生成的摘要（中英文）
content_translations — 全文翻译
ingest_runs       — 采集任务历史与统计
```

### 项目结构

```
src/
├── app/                  # Next.js App Router 页面
│   ├── page.tsx          # 首页信息流
│   ├── latest/           # 最新内容
│   ├── deep/             # 深度阅读
│   ├── content/[slug]/   # 文章详情页
│   └── api/              # API 路由
├── components/site/       # 站点 UI 组件
├── components/ui/        # shadcn/ui 基础组件
├── modules/
│   ├── content/          # 内容查询与视图模型
│   ├── ingest/          # 采集管线
│   ├── sources/          # 来源管理
│   └── summaries/        # 摘要生成
├── jobs/                 # 独立采集/摘要脚本
└── lib/                  # Supabase 客户端、工具函数
supabase/
├── migrations/           # Postgres schema
└── seed.sql             # 初始种子数据
```

### 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | ESLint 检查 |
| `npm run test` | Vitest 测试 |
| `npm run seed:sources` | 初始化默认数据源 |
| `npm run ingest:follow-builders` | 运行 Builder 信息流采集 |
| `npm run ingest:direct` | 运行直接内容采集 |
| `npm run summaries:run` | 运行一批摘要任务 |
| `npm run summaries:drain` | 连续运行多批摘要任务，直到 backlog 明显下降 |
