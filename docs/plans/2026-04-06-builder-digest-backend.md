# Builder Digest Backend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个基于 Node.js + Supabase 的内容网站后端，把 follow-builders 的公开 feed 以及后续自有采集源统一落库，支持内容采集、标准化、摘要生成、定时任务和查询 API。

**Architecture:** 第一阶段不要直接挑战全量自建采集，而是先消费 follow-builders 已公开的 `feed-x.json`、`feed-podcasts.json`、`feed-blogs.json`，建立完整的数据库、后台任务和 API 主链路。第二阶段再把每类数据源替换为自有 provider，所有外部内容先归一化成统一 `content_items` 模型，再异步生成摘要和聚合视图。

**Tech Stack:** Node.js 20, TypeScript, Fastify, Supabase Postgres, Supabase Storage, Supabase Auth, Supabase CLI, `@supabase/supabase-js`, Zod, Vitest, pino, node-cron

---

## 先定三条原则

1. 不要让浏览器直接读内容表。Supabase 先当数据库和对象存储，站点统一走 Node API。
2. 原文是主事实，摘要只是派生物。抓取到的 `raw_payload`、`raw_text`、`transcript_text` 都必须落库。
3. 先跑通一条稳定的数据链路，再追求“全自建抓取”。X 的官方 API、反爬、成本和 ToS 复杂度都不低。

## 前台分类先收敛

当前阶段前台不再区分“研究”和“产品”，统一只保留 `全部 / 文章 / 动态` 三个入口，避免分类稀疏。

- `tweet`、短更新、发布类内容映射到 `news`
- `podcast_episode`、`blog_post`、日报摘要、长文解读映射到 `article`
- 未来如果真实供给稳定，再考虑把“研究”或“产品”拆出来

## 从 follow-builders 里直接借鉴什么

1. `config/default-sources.json` 直接作为第一版源清单种子数据。
2. `feed-x.json`、`feed-podcasts.json`、`feed-blogs.json` 直接作为 Phase 1 的上游数据源。
3. `generate-feed.js` 的“发现内容 -> 拉正文/转写 -> 标准化”思路直接借鉴，但不要继续用 JSON 文件做状态。
4. `state-feed.json` 的去重思想保留，但实现要换成数据库唯一键和幂等 `upsert`。
5. `prompts/` 可以作为摘要提示词的第一版来源，后面改成数据库或本地模板配置。

## 推荐目录结构

```text
.
├── docs/plans/2026-04-06-builder-digest-backend.md
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   └── env.ts
│   ├── lib/
│   │   ├── logger.ts
│   │   └── supabase-admin.ts
│   ├── modules/
│   │   ├── sources/
│   │   │   ├── default-sources.ts
│   │   │   └── source.service.ts
│   │   ├── ingest/
│   │   │   ├── types.ts
│   │   │   ├── normalize.ts
│   │   │   ├── ingest.service.ts
│   │   │   └── providers/
│   │   │       ├── follow-builders.provider.ts
│   │   │       ├── rss.provider.ts
│   │   │       ├── blog.provider.ts
│   │   │       └── x.provider.ts
│   │   ├── content/
│   │   │   ├── content.service.ts
│   │   │   └── content.repository.ts
│   │   ├── summaries/
│   │   │   ├── summary.service.ts
│   │   │   └── prompts/
│   │   │       ├── summarize-tweets.md
│   │   │       ├── summarize-podcast.md
│   │   │       └── summarize-blogs.md
│   │   └── api/
│   │       ├── public.routes.ts
│   │       └── internal.routes.ts
│   └── jobs/
│       ├── run-follow-builders-ingest.ts
│       ├── run-direct-ingest.ts
│       └── run-summary-jobs.ts
├── supabase/
│   ├── config.toml
│   ├── seed.sql
│   └── migrations/
│       └── 20260406213000_init_builder_digest.sql
└── tests/
    ├── modules/
    │   ├── ingest/
    │   ├── content/
    │   └── summaries/
    └── routes/
```

## 数据模型

第一版不要拆太细，但也不要把所有东西塞进一个大表。推荐 7 张核心表。

### `sources`

记录“源配置”，比如一个 X 账号、一个播客、一个博客，或者一个公开 feed provider。

- `id uuid primary key`
- `key text not null unique`
- `type text not null check (type in ('x_account', 'podcast', 'blog', 'upstream_feed'))`
- `name text not null`
- `homepage_url text`
- `external_handle text`
- `config jsonb not null default '{}'::jsonb`
- `active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `creators`

记录“内容发布者”，比如 Karpathy、某个播客节目、某个博客作者。

- `id uuid primary key`
- `source_id uuid references sources(id) on delete cascade`
- `external_id text not null`
- `display_name text not null`
- `handle text`
- `bio text`
- `profile_url text`
- `avatar_url text`
- `raw_payload jsonb not null default '{}'::jsonb`
- `unique(source_id, external_id)`

### `content_items`

统一的内容主表，tweet、播客单集、博客文章都放这里。

- `id uuid primary key`
- `source_id uuid references sources(id) on delete restrict`
- `creator_id uuid references creators(id) on delete set null`
- `external_id text not null`
- `kind text not null check (kind in ('tweet', 'podcast_episode', 'blog_post'))`
- `title text`
- `slug text not null unique`
- `url text not null`
- `published_at timestamptz not null`
- `language text not null default 'en'`
- `status text not null default 'published'`
- `raw_payload jsonb not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `unique(source_id, external_id)`

### `content_bodies`

长文本内容单独放，避免 `content_items` 行太肥。

- `content_item_id uuid primary key references content_items(id) on delete cascade`
- `plain_text text`
- `html text`
- `transcript_text text`
- `markdown text`

### `content_metrics`

- `content_item_id uuid primary key references content_items(id) on delete cascade`
- `likes integer not null default 0`
- `shares integer not null default 0`
- `replies integer not null default 0`
- `views integer`
- `collected_at timestamptz not null default now()`

### `content_summaries`

- `id uuid primary key`
- `content_item_id uuid references content_items(id) on delete cascade`
- `locale text not null check (locale in ('en', 'zh'))`
- `summary text not null`
- `bullets jsonb not null default '[]'::jsonb`
- `model text`
- `status text not null default 'completed'`
- `created_at timestamptz not null default now()`
- `unique(content_item_id, locale)`

### `ingest_runs`

- `id uuid primary key`
- `provider_key text not null`
- `status text not null check (status in ('running', 'completed', 'failed'))`
- `started_at timestamptz not null default now()`
- `finished_at timestamptz`
- `stats jsonb not null default '{}'::jsonb`
- `error_text text`

## 推荐初始 SQL

下面这份 SQL 直接作为第一版 migration 起点。

```sql
create extension if not exists pgcrypto;

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  type text not null check (type in ('x_account', 'podcast', 'blog', 'upstream_feed')),
  name text not null,
  homepage_url text,
  external_handle text,
  config jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creators (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  external_id text not null,
  display_name text not null,
  handle text,
  bio text,
  profile_url text,
  avatar_url text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, external_id)
);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete restrict,
  creator_id uuid references public.creators(id) on delete set null,
  external_id text not null,
  kind text not null check (kind in ('tweet', 'podcast_episode', 'blog_post')),
  title text,
  slug text not null unique,
  url text not null,
  published_at timestamptz not null,
  language text not null default 'en',
  status text not null default 'published',
  raw_payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, external_id)
);

create table public.content_bodies (
  content_item_id uuid primary key references public.content_items(id) on delete cascade,
  plain_text text,
  html text,
  transcript_text text,
  markdown text,
  updated_at timestamptz not null default now()
);

create table public.content_metrics (
  content_item_id uuid primary key references public.content_items(id) on delete cascade,
  likes integer not null default 0,
  shares integer not null default 0,
  replies integer not null default 0,
  views integer,
  collected_at timestamptz not null default now()
);

create table public.content_summaries (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  locale text not null check (locale in ('en', 'zh')),
  summary text not null,
  bullets jsonb not null default '[]'::jsonb,
  model text,
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  unique (content_item_id, locale)
);

create table public.ingest_runs (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null,
  status text not null check (status in ('running', 'completed', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  stats jsonb not null default '{}'::jsonb,
  error_text text
);

create index idx_content_items_published_at on public.content_items (published_at desc);
create index idx_content_items_kind_published_at on public.content_items (kind, published_at desc);
create index idx_content_items_source_id on public.content_items (source_id);
create index idx_creators_handle on public.creators (handle);
```

## Phase 1 和 Phase 2 的边界

### Phase 1

直接从以下公开地址拉数据并落库：

- `https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-x.json`
- `https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-podcasts.json`
- `https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-blogs.json`

这样做的意义：

1. 你可以先把网站后端主链路做完整。
2. 你暂时不需要自己解决 X 的采集成本问题。
3. 你已经能开始建内容详情页、列表页、检索和摘要。

### Phase 2

把 provider 逐步替换成你自己的：

- `x.provider.ts` 使用官方 API 或合规第三方
- `rss.provider.ts` 扫播客 RSS
- `blog.provider.ts` 抓博客首页和文章页

不要 Phase 1 就一把梭全部自建。

### Task 1: 初始化 Node.js + Supabase 工程

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `src/app.ts`
- Create: `src/server.ts`
- Create: `src/config/env.ts`
- Create: `src/lib/logger.ts`
- Test: `tests/routes/health.test.ts`

**Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app';

describe('GET /health', () => {
  it('returns ok', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
  });
});
```

**Step 2: 运行测试并确认失败**

Run: `npm test -- tests/routes/health.test.ts`
Expected: FAIL with `Cannot find module '../../src/app'`

**Step 3: 写最小实现**

```ts
import Fastify from 'fastify';

export function buildApp() {
  const app = Fastify();

  app.get('/health', async () => ({ ok: true }));

  return app;
}
```

```ts
import { buildApp } from './app';

const app = buildApp();

app.listen({ port: 3000, host: '0.0.0.0' }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
```

**Step 4: 再次运行测试**

Run: `npm test -- tests/routes/health.test.ts`
Expected: PASS

**Step 5: 提交**

```bash
git add package.json tsconfig.json .env.example src/app.ts src/server.ts src/config/env.ts src/lib/logger.ts tests/routes/health.test.ts
git commit -m "chore: bootstrap node api and health route"
```

### Task 2: 建立 Supabase migration 和本地数据库

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/20260406213000_init_builder_digest.sql`
- Create: `supabase/seed.sql`
- Test: `tests/modules/content/schema-smoke.test.ts`

**Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';

describe('schema smoke', () => {
  it('documents required tables', () => {
    const requiredTables = [
      'sources',
      'creators',
      'content_items',
      'content_bodies',
      'content_metrics',
      'content_summaries',
      'ingest_runs'
    ];

    expect(requiredTables).toHaveLength(7);
  });
});
```

**Step 2: 初始化 Supabase**

Run: `npx supabase init`
Expected: 生成 `supabase/config.toml`

**Step 3: 写 migration**

把本计划上面的 SQL 原样写入：

`supabase/migrations/20260406213000_init_builder_digest.sql`

**Step 4: 重建数据库并验证**

Run: `npx supabase db reset`
Expected: PASS and migration applied

**Step 5: 提交**

```bash
git add supabase/config.toml supabase/migrations/20260406213000_init_builder_digest.sql supabase/seed.sql tests/modules/content/schema-smoke.test.ts
git commit -m "feat: add initial supabase schema"
```

### Task 3: 写 Supabase Admin 客户端和环境配置

**Files:**
- Create: `src/lib/supabase-admin.ts`
- Modify: `src/config/env.ts`
- Test: `tests/modules/content/supabase-admin.test.ts`

**Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { getRequiredEnv } from '../../../src/config/env';

describe('env', () => {
  it('returns required keys', () => {
    expect(getRequiredEnv().SUPABASE_URL).toBeDefined();
    expect(getRequiredEnv().SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
  });
});
```

**Step 2: 写环境变量访问器**

```ts
const requiredKeys = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;

export function getRequiredEnv() {
  const result = {} as Record<(typeof requiredKeys)[number], string>;

  for (const key of requiredKeys) {
    const value = process.env[key];
    if (!value) throw new Error(`Missing env: ${key}`);
    result[key] = value;
  }

  return result;
}
```

**Step 3: 写 Admin 客户端**

```ts
import { createClient } from '@supabase/supabase-js';
import { getRequiredEnv } from '../config/env';

const env = getRequiredEnv();

export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
```

**Step 4: 运行测试**

Run: `npm test -- tests/modules/content/supabase-admin.test.ts`
Expected: PASS

**Step 5: 提交**

```bash
git add src/config/env.ts src/lib/supabase-admin.ts tests/modules/content/supabase-admin.test.ts
git commit -m "feat: add supabase admin client"
```

### Task 4: 把 follow-builders 源清单落为种子数据

**Files:**
- Create: `src/modules/sources/default-sources.ts`
- Create: `src/modules/sources/source.service.ts`
- Create: `src/jobs/seed-sources.ts`
- Test: `tests/modules/sources/default-sources.test.ts`

**Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { defaultSources } from '../../../src/modules/sources/default-sources';

describe('default sources', () => {
  it('contains upstream feed and curated sources', () => {
    expect(defaultSources.some((item) => item.key === 'follow-builders-feed')).toBe(true);
    expect(defaultSources.some((item) => item.type === 'x_account')).toBe(true);
    expect(defaultSources.some((item) => item.type === 'podcast')).toBe(true);
    expect(defaultSources.some((item) => item.type === 'blog')).toBe(true);
  });
});
```

**Step 2: 把上游清单转成本地常量**

推荐直接参考 follow-builders 的 `default-sources.json`，但本地结构统一成：

```ts
export const defaultSources = [
  {
    key: 'follow-builders-feed',
    type: 'upstream_feed',
    name: 'Follow Builders Public Feed',
    homepageUrl: 'https://github.com/zarazhangrui/follow-builders',
    config: {
      feedXUrl: 'https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-x.json',
      feedPodcastsUrl: 'https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-podcasts.json',
      feedBlogsUrl: 'https://raw.githubusercontent.com/zarazhangrui/follow-builders/main/feed-blogs.json'
    }
  },
  {
    key: 'x-karpathy',
    type: 'x_account',
    name: 'Andrej Karpathy',
    homepageUrl: 'https://x.com/karpathy',
    externalHandle: 'karpathy',
    config: {}
  }
];
```

**Step 3: 写入 `sources` 表**

`src/jobs/seed-sources.ts` 里做幂等 `upsert`：

```ts
await supabaseAdmin.from('sources').upsert(
  defaultSources.map((item) => ({
    key: item.key,
    type: item.type,
    name: item.name,
    homepage_url: item.homepageUrl,
    external_handle: item.externalHandle ?? null,
    config: item.config
  })),
  { onConflict: 'key' }
);
```

**Step 4: 运行种子脚本**

Run: `node --import tsx src/jobs/seed-sources.ts`
Expected: `sources` 表写入成功

**Step 5: 提交**

```bash
git add src/modules/sources/default-sources.ts src/modules/sources/source.service.ts src/jobs/seed-sources.ts tests/modules/sources/default-sources.test.ts
git commit -m "feat: add source seed data"
```

### Task 5: 定义统一内容归一化协议

**Files:**
- Create: `src/modules/ingest/types.ts`
- Create: `src/modules/ingest/normalize.ts`
- Test: `tests/modules/ingest/normalize.test.ts`

**Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { buildSlug } from '../../../src/modules/ingest/normalize';

describe('buildSlug', () => {
  it('creates stable slugs from kind and external id', () => {
    expect(buildSlug('tweet', '2040806346556428585')).toBe('tweet-2040806346556428585');
  });
});
```

**Step 2: 声明统一类型**

```ts
export type NormalizedContent = {
  sourceKey: string;
  creatorExternalId: string;
  creatorDisplayName: string;
  creatorHandle?: string;
  creatorBio?: string;
  creatorProfileUrl?: string;
  kind: 'tweet' | 'podcast_episode' | 'blog_post';
  externalId: string;
  title?: string;
  url: string;
  publishedAt: string;
  plainText?: string;
  transcriptText?: string;
  metrics?: {
    likes?: number;
    shares?: number;
    replies?: number;
    views?: number;
  };
  rawPayload: Record<string, unknown>;
};
```

**Step 3: 写 slug 和 payload 归一化**

```ts
export function buildSlug(kind: string, externalId: string) {
  return `${kind}-${externalId}`.toLowerCase();
}
```

**Step 4: 运行测试**

Run: `npm test -- tests/modules/ingest/normalize.test.ts`
Expected: PASS

**Step 5: 提交**

```bash
git add src/modules/ingest/types.ts src/modules/ingest/normalize.ts tests/modules/ingest/normalize.test.ts
git commit -m "feat: add normalized ingest contracts"
```

### Task 6: 实现 Phase 1 的 follow-builders feed provider

**Files:**
- Create: `src/modules/ingest/providers/follow-builders.provider.ts`
- Test: `tests/modules/ingest/follow-builders.provider.test.ts`

**Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { mapTweetFeedItem } from '../../../src/modules/ingest/providers/follow-builders.provider';

describe('follow-builders provider', () => {
  it('maps tweet feed item into normalized content', () => {
    const item = mapTweetFeedItem(
      { name: 'Andrej Karpathy', handle: 'karpathy', bio: 'bio' },
      {
        id: '1',
        text: 'hello world',
        createdAt: '2026-04-05T14:58:44.000Z',
        url: 'https://x.com/karpathy/status/1',
        likes: 1,
        retweets: 2,
        replies: 3
      }
    );

    expect(item.kind).toBe('tweet');
    expect(item.externalId).toBe('1');
    expect(item.metrics?.likes).toBe(1);
  });
});
```

**Step 2: 实现 provider**

Provider 要做三件事：

1. 拉 3 个 feed JSON
2. 把 tweet / podcast / blog 全部转成 `NormalizedContent[]`
3. 不在这里落库

关键映射示例：

```ts
export function mapTweetFeedItem(author: any, tweet: any): NormalizedContent {
  return {
    sourceKey: `x-${author.handle.toLowerCase()}`,
    creatorExternalId: author.handle.toLowerCase(),
    creatorDisplayName: author.name,
    creatorHandle: author.handle,
    creatorBio: author.bio ?? '',
    creatorProfileUrl: `https://x.com/${author.handle}`,
    kind: 'tweet',
    externalId: tweet.id,
    title: null,
    url: tweet.url,
    publishedAt: tweet.createdAt,
    plainText: tweet.text,
    rawPayload: tweet,
    metrics: {
      likes: tweet.likes ?? 0,
      shares: tweet.retweets ?? 0,
      replies: tweet.replies ?? 0
    }
  };
}
```

播客映射注意：

1. `guid` 作为 `externalId`
2. `transcript` 存到 `transcriptText`
3. 当前上游 feed 给的是频道链接，不一定是单集链接，所以原始 payload 要完整保留，后面便于修正

**Step 3: 运行测试**

Run: `npm test -- tests/modules/ingest/follow-builders.provider.test.ts`
Expected: PASS

**Step 4: 手工试跑 provider**

Run: `node --import tsx src/jobs/run-follow-builders-ingest.ts --dry-run`
Expected: 打印标准化后的条数和首条样本

**Step 5: 提交**

```bash
git add src/modules/ingest/providers/follow-builders.provider.ts tests/modules/ingest/follow-builders.provider.test.ts
git commit -m "feat: add follow-builders feed provider"
```

### Task 7: 实现落库幂等 ingest service

**Files:**
- Create: `src/modules/content/content.repository.ts`
- Create: `src/modules/ingest/ingest.service.ts`
- Create: `src/jobs/run-follow-builders-ingest.ts`
- Test: `tests/modules/ingest/ingest.service.test.ts`

**Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { buildSlug } from '../../../src/modules/ingest/normalize';

describe('ingest idempotency contract', () => {
  it('uses source_id + external_id as natural key', () => {
    expect(buildSlug('blog_post', 'abc')).toBe('blog_post-abc');
  });
});
```

**Step 2: 实现 upsert 流程**

顺序必须是：

1. `sources` 查找
2. `creators` upsert
3. `content_items` upsert
4. `content_bodies` upsert
5. `content_metrics` upsert
6. `ingest_runs` 更新状态

核心代码骨架：

```ts
await supabaseAdmin.from('content_items').upsert(
  [{
    source_id: sourceId,
    creator_id: creatorId,
    external_id: item.externalId,
    kind: item.kind,
    title: item.title,
    slug: buildSlug(item.kind, item.externalId),
    url: item.url,
    published_at: item.publishedAt,
    language: 'en',
    raw_payload: item.rawPayload
  }],
  { onConflict: 'source_id,external_id' }
);
```

**Step 3: 写 run 脚本**

`src/jobs/run-follow-builders-ingest.ts`：

```ts
const runId = await ingestService.startRun('follow-builders-feed');
const items = await followBuildersProvider.fetchAll();
await ingestService.persistItems(runId, items);
await ingestService.finishRun(runId, { items: items.length });
```

**Step 4: 运行验证**

Run: `node --import tsx src/jobs/run-follow-builders-ingest.ts`
Expected: `ingest_runs` 里新增一条 completed，`content_items` 有数据

**Step 5: 提交**

```bash
git add src/modules/content/content.repository.ts src/modules/ingest/ingest.service.ts src/jobs/run-follow-builders-ingest.ts tests/modules/ingest/ingest.service.test.ts
git commit -m "feat: persist normalized content into supabase"
```

### Task 8: 实现摘要流水线

**Files:**
- Create: `src/modules/summaries/summary.service.ts`
- Create: `src/modules/summaries/prompts/summarize-tweets.md`
- Create: `src/modules/summaries/prompts/summarize-podcast.md`
- Create: `src/modules/summaries/prompts/summarize-blogs.md`
- Create: `src/jobs/run-summary-jobs.ts`
- Test: `tests/modules/summaries/summary.service.test.ts`

**Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';

describe('summary contract', () => {
  it('stores one summary per locale', () => {
    expect(['en', 'zh']).toContain('zh');
  });
});
```

**Step 2: 只做最小版本**

第一版不要做复杂队列，直接这样：

1. 查找没有 `content_summaries` 的 `content_items`
2. 根据 `kind` 选择 prompt
3. 调用 LLM 生成摘要
4. 写入 `content_summaries`

建议摘要输出结构：

```ts
type GeneratedSummary = {
  summary: string;
  bullets: string[];
};
```

**Step 3: 把 follow-builders prompt 借进来**

这些 prompt 可以直接作为第一版模板：

- `summarize-tweets.md`
- `summarize-podcast.md`
- `summarize-blogs.md`

后面如果要支持站内运营改文案，再把 prompt 放数据库。

**Step 4: 运行验证**

Run: `node --import tsx src/jobs/run-summary-jobs.ts`
Expected: `content_summaries` 有 `en` 和可选 `zh` 内容

**Step 5: 提交**

```bash
git add src/modules/summaries src/jobs/run-summary-jobs.ts tests/modules/summaries/summary.service.test.ts
git commit -m "feat: add content summary pipeline"
```

### Task 9: 实现公共读 API

**Files:**
- Create: `src/modules/content/content.service.ts`
- Create: `src/modules/api/public.routes.ts`
- Modify: `src/app.ts`
- Test: `tests/routes/public-feed.test.ts`

**Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app';

describe('GET /v1/feed', () => {
  it('returns paginated feed payload', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/v1/feed?limit=10' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty('items');
  });
});
```

**Step 2: 先做 4 个接口**

1. `GET /v1/feed?kind=&sourceKey=&cursor=&limit=`
2. `GET /v1/content/:slug`
3. `GET /v1/creators/:handle`
4. `GET /v1/sources`

`GET /v1/feed` 返回结构建议：

```json
{
  "items": [
    {
      "id": "uuid",
      "kind": "tweet",
      "title": null,
      "slug": "tweet-2040806346556428585",
      "url": "https://x.com/karpathy/status/2040806346556428585",
      "publishedAt": "2026-04-05T14:58:44.000Z",
      "creator": {
        "name": "Andrej Karpathy",
        "handle": "karpathy"
      },
      "summary": {
        "locale": "zh",
        "text": "..."
      }
    }
  ],
  "nextCursor": "2026-04-05T14:58:44.000Z"
}
```

**Step 3: 注册路由**

```ts
app.register(publicRoutes, { prefix: '/v1' });
```

**Step 4: 运行测试**

Run: `npm test -- tests/routes/public-feed.test.ts`
Expected: PASS

**Step 5: 提交**

```bash
git add src/modules/content/content.service.ts src/modules/api/public.routes.ts src/app.ts tests/routes/public-feed.test.ts
git commit -m "feat: add public content api"
```

### Task 10: 实现内部任务触发接口和定时任务

**Files:**
- Create: `src/modules/api/internal.routes.ts`
- Create: `src/jobs/run-direct-ingest.ts`
- Modify: `src/app.ts`
- Test: `tests/routes/internal-jobs.test.ts`

**Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';

describe('internal jobs contract', () => {
  it('documents internal endpoints', () => {
    expect([
      '/internal/jobs/ingest/follow-builders',
      '/internal/jobs/ingest/direct',
      '/internal/jobs/summaries'
    ]).toHaveLength(3);
  });
});
```

**Step 2: 实现内部接口**

第一版只做这 3 个：

1. `POST /internal/jobs/ingest/follow-builders`
2. `POST /internal/jobs/ingest/direct`
3. `POST /internal/jobs/summaries`

这些接口必须要求内部 token，不要裸暴露。

**Step 3: 配置 cron**

生产环境推荐：

- 每小时跑一次 `follow-builders` feed ingest
- 每 6 小时跑一次 direct ingest
- 每 15 分钟跑一次 summaries

本地开发先用 `node-cron`，生产再换平台 cron。

**Step 4: 验证**

Run: `curl -X POST http://localhost:3000/internal/jobs/ingest/follow-builders -H "x-internal-token: local-dev-token"`
Expected: 返回 run id 和任务状态

**Step 5: 提交**

```bash
git add src/modules/api/internal.routes.ts src/jobs/run-direct-ingest.ts src/app.ts tests/routes/internal-jobs.test.ts
git commit -m "feat: add internal job triggers"
```

### Task 11: 接入 Phase 2 的自有 provider

**Files:**
- Create: `src/modules/ingest/providers/rss.provider.ts`
- Create: `src/modules/ingest/providers/blog.provider.ts`
- Create: `src/modules/ingest/providers/x.provider.ts`
- Test: `tests/modules/ingest/rss.provider.test.ts`
- Test: `tests/modules/ingest/blog.provider.test.ts`
- Test: `tests/modules/ingest/x.provider.test.ts`

**Step 1: 先实现 RSS provider**

优先级顺序：

1. 播客 RSS
2. 博客 HTML 抓取
3. X provider

因为 X 是最容易把时间烧光的一类。

**Step 2: 从 follow-builders 借算法，不借状态文件**

可以借鉴的逻辑：

1. RSS 扫最近几条
2. 按时间窗口过滤
3. Transcript 成功后再落正文
4. HTML 抓首页，取文章链接，再抓详情页

不要借鉴的逻辑：

1. 不要用 `state-feed.json`
2. 不要把 feed 结果提交回 Git 仓库
3. 不要依赖“抓取失败也标记已处理”

**Step 3: 接进统一 provider interface**

```ts
export interface IngestProvider {
  key: string;
  fetchAll(): Promise<NormalizedContent[]>;
}
```

**Step 4: 跑集成验证**

Run: `node --import tsx src/jobs/run-direct-ingest.ts`
Expected: 新 provider 产出的数据能进入同一套 `content_items`

**Step 5: 提交**

```bash
git add src/modules/ingest/providers tests/modules/ingest
git commit -m "feat: add direct source providers"
```

### Task 12: 加上上线前必要的保护

**Files:**
- Modify: `src/app.ts`
- Modify: `src/modules/api/internal.routes.ts`
- Create: `tests/routes/authz.test.ts`

**Step 1: 补鉴权**

必须做到：

1. `SUPABASE_SERVICE_ROLE_KEY` 只在服务端使用
2. 内部路由必须校验 `INTERNAL_API_TOKEN`
3. Node API 返回给前端的 payload 只包含站点需要的字段

**Step 2: 补日志**

每次 ingest run 至少记录：

1. provider
2. duration
3. new items
4. updated items
5. failed items

**Step 3: 补失败重试策略**

第一版够用的策略：

1. `ingest_runs.status = failed`
2. 保留 `error_text`
3. 下一轮任务允许重试
4. 不要因为单条失败让整批 run 直接崩掉

**Step 4: 运行全量验证**

Run: `npm test`
Expected: PASS

Run: `npx supabase db reset`
Expected: PASS

Run: `node --import tsx src/jobs/run-follow-builders-ingest.ts`
Expected: PASS

Run: `node --import tsx src/jobs/run-summary-jobs.ts`
Expected: PASS

**Step 5: 提交**

```bash
git add src/app.ts src/modules/api/internal.routes.ts tests/routes/authz.test.ts
git commit -m "chore: harden internal api and ingest logging"
```

## 你现在最该先做的不是 UI

先把下面这条链路跑通：

1. `follow-builders` 公开 feed 拉下来
2. 标准化成 `NormalizedContent`
3. 写入 Supabase
4. 生成摘要
5. `GET /v1/feed` 能把内容吐出来

只要这条链路是通的，网站前台只是消费问题。

## 明确哪些点不要一开始就做

1. 不要先做复杂标签系统
2. 不要先做全文搜索
3. 不要先做 embedding 和推荐
4. 不要先做浏览器直连 Supabase 内容表
5. 不要先自建 X 全量采集

## 上线前检查清单

1. `content_items` 的唯一键是否稳定
2. 同一条 tweet 重复 ingest 是否只更新不新增
3. podcast transcript 是否单独落 `content_bodies.transcript_text`
4. blog 原文是否完整保留在 `plain_text` 或 `html`
5. internal token 是否没泄露到前端
6. service role key 是否只存在服务端环境变量
7. `GET /v1/feed` 是否支持 cursor 分页
8. 摘要失败是否不影响原文入库

## 做完 Phase 1 之后的自然演进

1. 增加 `pgvector` 做相似内容推荐
2. 增加 `materialized view` 做首页聚合
3. 增加 `creator` 维度统计页
4. 增加多语言摘要缓存
5. 增加站内全文检索
