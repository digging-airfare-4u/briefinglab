## ADDED Requirements

### Requirement: Date-grouped Multi-category Feed
首页内容流 MUST 按日期分组展示内容，并允许用户在不离开首页的情况下按分类浏览。

#### Scenario: Date grouping
- **WHEN** 首页返回多天内容
- **THEN** 内容必须按日期标题分组展示
- **THEN** 每个日期组内的内容必须默认按发布时间倒序排列

#### Scenario: Category switching
- **WHEN** 用户切换全部、文章或动态分类
- **THEN** 内容流必须刷新为对应分类结果
- **THEN** 当前激活分类必须有明确的视觉状态

### Requirement: Mixed Editorial Card System
首页 MUST 同时支持普通资讯卡和日报摘要卡，以形成信息密度与编辑感并存的阅读节奏。

#### Scenario: Standard news card
- **WHEN** 内容项属于常规资讯
- **THEN** 页面必须以普通资讯卡展示标题、摘要片段、来源、作者和发布时间

#### Scenario: Digest card
- **WHEN** 内容项被标记为日报摘要或深度内容
- **THEN** 页面必须以更长的摘要卡展示摘要正文和要点信息

### Requirement: Editorial Right Rail
桌面端首页 MUST 提供右侧精选区域，用于突出每日精选、深度内容或日报摘要。

#### Scenario: Desktop editorial rail
- **WHEN** 用户在桌面端浏览首页
- **THEN** 右侧区域必须展示至少一个精选模块
- **THEN** 该区域的内容必须与主内容流形成明确的视觉层次区分

#### Scenario: Compact rail on smaller viewports
- **WHEN** 用户在平板或更小视口浏览首页
- **THEN** 右侧精选区域可以折叠、下移或并入主流
- **THEN** 但精选内容不得完全丢失
