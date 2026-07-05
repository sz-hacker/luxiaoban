# 智能案卷评查系统 — 移动端 APP 设计文档

> **源站**：https://ai-test.luxiaoban.com/hb（Web H5 转移动端 Vue 项目）  
> **测试账号**：`13144556600` / `2UYPafNz`  
> 基于源站页面爬取与分析  
> 设计目标：将 Web 端「侧边栏 + 表格」管理后台，改造为适合手机使用的移动 APP 交互模式

---

## 1. 系统概述

**智能案卷评查系统**面向生态环境执法领域，提供：

- **案卷评查**：上传行政处罚案卷，AI 自动比对法规标准并标注问题
- **扣分明细**：按年度/季度查看各案卷扣分项
- **到期提醒**：创建周期性任务，管理待办/已办及统计分析

Web 端共 **9 个页面**（含 2 个隐藏流程页），API 统一前缀 `/hb/api/v1`，认证方式为 **Bearer Token**。

---

## 2. Web 端页面清单

| # | 路由 | 页面名称 | 需登录 | 说明 |
|---|------|----------|--------|------|
| 1 | `/hb/welcome` | 欢迎页 | 否 | 产品介绍、统计数据、登录入口 |
| 2 | `/hb/application/caseReview` | 评查案卷 | 是 | 案卷列表、搜索、上传、一键评查 |
| 3 | `/hb/application/deductionList` | 扣分明细 | 是 | 按年/季度查看扣分记录 |
| 4 | `/hb/application/RTUJOGjyMx4n` | 案卷评测 | 是 | 隐藏页，AI 评测详情 |
| 5 | `/hb/application/review_process` | 评查流程 | 是 | 隐藏页，评查进度 |
| 6 | `/hb/task/taskList` | 创建任务 | 是 | 任务 CRUD |
| 7 | `/hb/task/expirationReminder/pending` | 待办任务 | 是 | 到期提醒待办 |
| 8 | `/hb/task/expirationReminder/done` | 已办任务 | 是 | 已完成任务 |
| 9 | `/hb/task/expirationReminder/statistics` | 任务统计 | 是 | 图表统计 |

---

## 3. 核心 API 接口

详细入参/出参见 `res/api-catalog.json`，原始响应见 `res/api-data/`。

| 接口 | 方法 | 路径 | 用途 |
|------|------|------|------|
| 登录 | POST | `/auth/login` | username + password → token |
| 用户信息 | POST | `/user/get_user_info` | 获取当前用户 |
| 案卷列表 | POST | `/parse-tasks/list` | 分页 + 四条件筛选 |
| 扣分明细 | POST | `/parse-tasks/deductions/list` | year + quarter 筛选 |
| 任务列表 | POST | `/tasks/list` | 创建任务页 |
| 待办/已办 | POST | `/task-todos/list` | status: -2 待办 / 80 已办 |
| 到期计数 | POST | `/task-todos/status-count` | 今日/3天/7天/超期 |
| 统计图表 | POST | `/task-todo-statistics/*` | 4 个统计接口 |

**统一响应格式：**

```json
{
  "code": 200,
  "message": "查询成功",
  "data": [],
  "total": 0,
  "page": 1,
  "page_size": 10
}
```

---

## 4. Web → APP 设计策略

### 4.1 信息架构重组

Web 端采用「左侧树形菜单 + 右侧表格」，移动端改为 **底部 Tab + 卡片列表**：

```
┌─────────────────────────────┐
│  顶部导航栏（标题 + 筛选）    │
├─────────────────────────────┤
│                             │
│  主内容区（卡片 / 列表）      │
│                             │
├─────────────────────────────┤
│ 首页 │ 案卷 │ 任务 │ 我的    │  ← 底部 Tab
└─────────────────────────────┘
```

| Tab | 对应 Web 模块 | APP 页面 |
|-----|--------------|----------|
| 首页 | welcome + 统计概览 | 欢迎/数据看板 |
| 案卷 | 评查案卷 + 扣分明细 | 案卷列表 + 扣分二级页 |
| 任务 | 到期提醒全套 | 待办/已办/统计 子 Tab |
| 我的 | 个人中心 | 用户信息 + 退出 |

### 4.2 交互改造要点

| Web 模式 | APP 模式 | 原因 |
|----------|----------|------|
| 侧边栏多级菜单 | 底部 4 Tab + 页内 Segmented | 拇指可达、减少层级 |
| 表格 4 列筛选 | 顶部搜索 + 筛选抽屉 | 节省竖屏空间 |
| 表格行操作 | 卡片 + 滑动/底部按钮 | 触控友好 |
| 分页器 | 上拉加载更多 | 移动端习惯 |
| 弹窗登录 | 独立登录页 | 全屏表单更易输入 |
| 统计图表 | 简化条形/数字卡片 | 小屏可读 |

### 4.3 视觉规范

沿用 Web 品牌色：

- 主色：`#1677FF`（蓝色渐变按钮）
- 背景：`#F0F5FF` → `#FFFFFF` 渐变
- 卡片：圆角 12px，轻阴影
- 字体：系统默认 sans-serif，标题 18px，正文 14px

### 4.4 路由设计（Vue APP）

```
/                    → 欢迎页（未登录可浏览）
/login               → 登录
/cases               → 案卷列表（需登录）
/cases/:id           → 案卷详情（预留）
/deductions          → 扣分明细
/tasks               → 任务（子 Tab: 待办/已办/统计）
/profile             → 我的
```

---

## 5. 页面 wireframe

### 5.1 首页

- Hero：AI驱动案卷评查
- 4 个 KPI 卡片（139份 / 97.6% / 85% / 546项）
- 3 步流程说明
- CTA：进入系统 / 登录

### 5.2 案卷列表

- 筛选：处罚主体、文号、立案号、当事人（抽屉）
- 卡片字段：处罚主体、当事人、文号、进度条、状态
- 操作：一键评查、删除
- FAB：上传案卷

### 5.3 扣分明细

- 顶部：年/季度选择器
- 卡片：文号、文书名、扣分描述、扣分值

### 5.4 任务模块

- 顶部 Segmented：待办 | 已办 | 统计
- 待办：到期倒计时标签（今日/超期）
- 统计：4 格计数 + 类型分布条

### 5.5 我的

- 头像、姓名、部门
- 菜单：个人中心、退出登录

---

## 6. 技术实现（vue/ 目录）

| 模块 | 说明 |
|------|------|
| `src/api/` | Axios 封装，Bearer 注入 |
| `src/stores/user.ts` | Pinia 登录态 |
| `src/views/` | 各页面组件 |
| `src/components/AppTabBar.vue` | 底部导航 |
| `vite.config.ts` | 开发代理 `/hb/api` → 测试服 |

---

## 7. 数据文件索引

| 文件 | 内容 |
|------|------|
| `res/api-catalog.json` | API 目录（入参/出参） |
| `res/api-data/*.json` | 各接口原始响应 |
| `res/index.js` | Web 端打包 JS（逆向参考） |
| `res/routes` (api-data/routes.json) | 页面路由配置 |

---

## 8. 后续扩展

1. 案卷详情页对接 `/application/review_process`
2. AI 评查助手对话（Web 侧边栏功能）
3. 文件上传（`/parse-tasks/upload`）与拍照上传
4. 推送通知（任务到期提醒）
5. 离线缓存案卷列表
