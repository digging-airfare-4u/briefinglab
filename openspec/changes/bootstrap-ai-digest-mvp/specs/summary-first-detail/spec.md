## ADDED Requirements

### Requirement: Summary-first Content Detail
内容详情页 MUST 以站内摘要为第一阅读层，而不是直接把原文作为主内容区域。

#### Scenario: Detail page structure
- **WHEN** 用户打开任意内容详情页
- **THEN** 页面必须优先展示中文摘要或站内摘要
- **THEN** 页面必须同时展示标题、来源、作者和发布时间等基础信息
- **THEN** 原文跳转入口必须清晰可见

### Requirement: Key Points and Source Traceability
内容详情页 MUST 帮助用户快速理解内容重点，并保留清晰的来源追溯能力。

#### Scenario: Summary bullets available
- **WHEN** 内容具有结构化要点
- **THEN** 页面必须展示要点列表，帮助用户快速浏览核心观点

#### Scenario: Source context
- **WHEN** 用户查看详情页
- **THEN** 页面必须展示来源名称、原文链接和创作者信息
- **THEN** 用户必须能在一跳内访问原始内容

### Requirement: Graceful Fallback for Missing Summaries
当摘要尚未生成时，详情页 MUST 仍然提供可用的阅读体验，而不是直接报错或空白。

#### Scenario: Summary pending
- **WHEN** 内容详情页尚无可用摘要
- **THEN** 页面必须显示原文片段、基础元数据或处理中状态
- **THEN** 原文链接仍然必须可访问
