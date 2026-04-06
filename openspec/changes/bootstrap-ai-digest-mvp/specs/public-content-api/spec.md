## ADDED Requirements

### Requirement: Feed API for Homepage Consumption
系统 MUST 提供面向前端的公共内容 feed 接口，以支撑首页内容流、分类切换和分页加载。

#### Scenario: Feed query
- **WHEN** 前端请求内容 feed，并附带分类、分页或来源参数
- **THEN** API 必须返回可直接用于渲染列表的内容集合
- **THEN** 每条内容必须包含 slug、分类、展示摘要、来源、创作者和发布时间等必要字段

#### Scenario: Cursor pagination
- **WHEN** 前端请求下一页内容
- **THEN** API 必须返回稳定的 cursor 分页结果
- **THEN** 前端不得依赖数据库 offset 语义直接分页

### Requirement: Detail API for Summary-first Page
系统 MUST 提供面向详情页的内容查询接口，以返回摘要优先页面所需的完整 ViewModel。

#### Scenario: Content detail lookup
- **WHEN** 前端以 slug 请求单篇内容
- **THEN** API 必须返回摘要、要点、原文链接、来源信息、作者信息和发布时间

### Requirement: Frontend Isolation from Storage Schema
浏览器侧 MUST 不直接查询 Supabase 内容表，而是通过服务端接口获取稳定的前端视图数据。

#### Scenario: Browser access pattern
- **WHEN** 前端渲染首页或详情页
- **THEN** 浏览器只能访问公共 API 或服务端渲染数据层
- **THEN** 不能直接暴露数据库表结构、service role key 或内部任务接口
