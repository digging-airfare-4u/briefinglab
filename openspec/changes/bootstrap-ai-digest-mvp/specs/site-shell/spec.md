## ADDED Requirements

### Requirement: Global Navigation and Adaptive Shell
站点 MUST 提供统一的全局外壳，包含顶部导航、分类导航和主内容区，并能根据设备宽度自适应调整布局。

#### Scenario: Desktop shell
- **WHEN** 用户在桌面视口打开首页
- **THEN** 页面必须展示顶部导航、左侧分类栏、中间主内容流和右侧精选栏

#### Scenario: Mobile shell
- **WHEN** 用户在手机视口打开首页
- **THEN** 左侧分类栏必须收纳为抽屉菜单
- **THEN** 主内容区必须切换为单列布局
- **THEN** 页面不得出现横向滚动

### Requirement: Reading-first Visual System
站点 MUST 采用阅读优先的视觉系统，确保界面干净、通透、层次清晰，并支持浅色与暗黑两套主题。

#### Scenario: Light theme by default
- **WHEN** 用户首次访问站点
- **THEN** 页面必须默认以浅色主题呈现
- **THEN** 背景、文字、卡片和分割元素必须具备足够的对比度和舒适的阅读节奏

#### Scenario: Dark theme support
- **WHEN** 用户切换到暗黑模式
- **THEN** 所有核心页面和组件必须在不破坏层级和可读性的前提下适配暗色主题

### Requirement: shadcn UI Foundation
站点的复用 UI 组件 MUST 基于 `shadcn/ui` 组件或其薄封装实现，以便保证一致性、可维护性和后续扩展效率。

#### Scenario: Shared components
- **WHEN** 项目实现按钮、卡片、徽标、抽屉、标签页或骨架屏等通用组件
- **THEN** 这些组件必须建立在 `shadcn/ui` 基础之上，而不是重新发明基础组件体系
