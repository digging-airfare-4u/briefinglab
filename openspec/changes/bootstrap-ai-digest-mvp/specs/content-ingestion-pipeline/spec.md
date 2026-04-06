## ADDED Requirements

### Requirement: Phase 1 Ingest from Public Upstream Feeds
系统 MUST 在 Phase 1 直接消费 `follow-builders` 提供的公开 feed，并将其归一化为统一内容模型。

#### Scenario: Public feed ingest
- **WHEN** 系统执行 Phase 1 ingest 任务
- **THEN** 必须拉取 tweet、podcast 和 blog 三类公开 feed
- **THEN** 必须将其标准化后写入统一内容模型

### Requirement: Raw Content Preservation
系统 MUST 保留原文、转写或原始 payload，确保摘要失败时内容依然可追溯和可重建。

#### Scenario: Raw payload retention
- **WHEN** 任意内容项被落库
- **THEN** 系统必须保存原始 payload
- **THEN** 对于长文本或播客内容，系统必须尽可能保留正文或 transcript

### Requirement: Summary Generation Workflow
系统 MUST 支持异步摘要生成，并优先提供中文摘要给前端消费。

#### Scenario: Summary generation
- **WHEN** 新内容入库且尚无摘要
- **THEN** 系统必须能够为其生成摘要和要点
- **THEN** 前端优先消费中文摘要

#### Scenario: Summary failure
- **WHEN** 摘要生成失败
- **THEN** 原始内容必须仍然保留并可通过公共 API 被访问
- **THEN** 单条摘要失败不得导致整批 ingest 任务不可用

### Requirement: Protected Internal Job Triggers
系统 MUST 通过受保护的内部接口或任务机制触发采集与摘要任务，不能将这些入口暴露给公开访问。

#### Scenario: Internal job security
- **WHEN** 任务接口被调用
- **THEN** 系统必须校验内部访问凭证
- **THEN** 未授权请求不得执行 ingest 或摘要任务
