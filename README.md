# Briefinglab · 采集

> A clean, summary-first AI news aggregator for builders — surfacing what people are building, thinking, and shipping.

[English](#english) · [中文](#中文)

---

## English

### What is Briefinglab?

**Briefinglab** is an AI-native content hub for builders. It collects tweets, podcasts, and blog posts from influential creators, normalizes them into a unified feed, and generates bilingual (EN/ZH) summaries so you can catch up on signal without the noise.

### Features

- **Unified feed** — Tweets, podcast episodes, and blog posts in one place
- **AI summaries** — Bilingual bullet-point summaries via LLM
- **Translation** — Full original + translated text side by side
- **RSS support** — Subscribe to curated feeds
- **Dark mode & responsive** — Works on any device

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, Radix UI |
| Backend | Next.js API Routes, Supabase Edge Functions |
| Database | Supabase Postgres (with RLS) |
| Auth | Supabase Auth |
| Ingest | Node.js jobs (`tsx`), LLM-powered summarization |
| Deployment | Vercel (frontend + functions), Supabase (database), GitHub Actions (scheduled jobs) |

### Quick Start

```bash
git clone https://github.com/digging-airfare-4u/briefinglab.git
cd briefinglab
npm install

# Start local Supabase
supabase start
supabase db push

# Configure environment
cp .env.example .env.local
# Fill in your Supabase and LLM credentials

# Seed data and run
npm run seed:sources
npm run dev
```

Run jobs locally:

```bash
npm run ingest:follow-builders   # fetch builder content
npm run summaries:run            # generate one summary batch
npm run summaries:drain          # drain backlog in batches
```

### Deploy

1. Create a [Supabase](https://supabase.com) project and run `supabase/migrations/20260406213000_init_builder_digest.sql`
2. Deploy to [Vercel](https://vercel.com/new/clone?repository-url=https://github.com/digging-airfare-4u/briefinglab)
3. Add environment variables in Vercel settings
4. Set up GitHub Actions secrets for scheduled ingest (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`)

### Database Schema

```
sources              — Content sources (X, podcasts, blogs)
creators             — Individual creators
content_items        — Normalized content
content_bodies       — Full text / HTML / transcripts
content_summaries    — LLM-generated summaries (EN/ZH)
content_translations — Full translations
ingest_runs          — Job history & stats
```

---

## 中文

### Briefinglab 是什么？

**Briefinglab（采集）** 是一个为 Builder 打造的 AI 原生内容聚合平台。系统自动抓取优质推文、播客和博客文章，统一整理成信息流，并生成中英文双语摘要，让你在无干扰的阅读体验中快速获取高价值信息。

### 功能特性

- **统一信息流** — 推文、播客、博客文章一站式聚合
- **AI 摘要** — 由 LLM 生成的中英双语要点摘要
- **全文翻译** — 原文与译文对照阅读
- **RSS 订阅** — 支持导出 curated 订阅源
- **暗色模式 & 响应式** — 全设备适配

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16, React 19, Tailwind CSS v4, Radix UI |
| 后端 | Next.js API Routes, Supabase Edge Functions |
| 数据库 | Supabase Postgres（含 RLS） |
| 认证 | Supabase Auth |
| 采集 | Node.js jobs (`tsx`)，LLM 摘要生成 |
| 部署 | Vercel（前端+函数），Supabase（数据库），GitHub Actions（定时任务） |

### 快速开始

```bash
git clone https://github.com/digging-airfare-4u/briefinglab.git
cd briefinglab
npm install

# 启动本地 Supabase
supabase start
supabase db push

# 配置环境变量
cp .env.example .env.local
# 填入 Supabase 和 LLM 相关配置

# 初始化并运行
npm run seed:sources
npm run dev
```

本地运行采集任务：

```bash
npm run ingest:follow-builders   # 抓取 Builder 内容
npm run summaries:run            # 运行一批摘要任务
npm run summaries:drain          # 批量 drain 摘要 backlog
```

### 部署

1. 创建 [Supabase](https://supabase.com) 项目并执行 `supabase/migrations/20260406213000_init_builder_digest.sql`
2. 一键部署到 [Vercel](https://vercel.com/new/clone?repository-url=https://github.com/digging-airfare-4u/briefinglab)
3. 在 Vercel 设置中配置环境变量
4. 在 GitHub Secrets 中配置定时任务所需的变量（`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`LLM_BASE_URL`、`LLM_API_KEY`、`LLM_MODEL`）

### 数据库结构

```
sources              — 内容来源（X、播客、博客）
creators             — 创作者
content_items        — 标准化内容条目
content_bodies       — 完整正文 / HTML / 转写文本
content_summaries    — LLM 生成的摘要（中英文）
content_translations — 全文翻译
ingest_runs          — 采集任务历史与统计
```
