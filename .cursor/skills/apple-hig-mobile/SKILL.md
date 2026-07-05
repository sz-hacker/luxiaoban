---
name: apple-hig-mobile
description: >-
  Apple Human Interface Guidelines 移动端 UI 规范。在 luxiaoban Vue H5 项目中
  调整布局、边距、间距、触控目标、Safe Area 时使用。
---

# Apple HIG 移动端 UI（luxiaoban）

Web H5 转移动端项目，视觉与布局参考 Apple iOS 规范，与现有品牌色（`#1677ff`）并存。

## 核心原则

1. **内容优先**：留白清晰，不挤占可读区域
2. **一致性**：全项目共用 `vue/src/assets/styles/variables.css` 间距令牌
3. **可触达**：拇指区操作，最小触控 44×44pt
4. **Safe Area**：刘海、Home Indicator 区域不放置关键交互

## 布局边距（UIKit）

来源：[Positioning content within layout margins](https://developer.apple.com/documentation/uikit/positioning-content-within-layout-margins)

| 场景 | 规范 |
|------|------|
| iPhone 页面左右边距 | **16pt**（compact width） |
| iPad / 宽屏 | **20pt**（regular width） |
| 本项目 `max-width: 480px` | 统一 **16px** 水平边距 |

## 8pt 间距网格

| 级别 | 值 | 典型用途 |
|------|-----|----------|
| 微调 | 4px | 图标与文字、标签内边距 |
| 小 | 8px | 同行元素、列表行内元素 |
| 中 | 16px | 卡片 padding、卡片间距、页面边距 |
| 大 | 24px | 区块标题与内容、空状态 padding |
| 特大 | 32px | 登录表单、Hero 区块 |

## 触控与导航

| 元素 | 规范 |
|------|------|
| 最小触控目标 | **44×44pt** |
| Tab Bar 高度 | **49pt** + Safe Area |
| Navigation Bar | **44pt** 内容区（本项目 Header 48px 含视觉渐变） |
| 列表行最小高度 | **44pt** |

## 本项目 CSS 变量

定义于 `vue/src/assets/styles/variables.css`：

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 16px;
--space-4: 24px;
--space-5: 32px;
--page-margin-x: 16px;
--page-margin-y: 16px;
--page-margin-bottom: 16px;
--card-padding: 16px;
--card-gap: 16px;
--touch-min: 44px;
--tabbar-h: 49px;
```

## 常用模式

### 标准滚动页

使用 `utilities.css` 中的 `.page`：

```css
.page {
  padding: var(--page-margin-y) var(--page-margin-x) var(--page-margin-bottom);
}
```

### 卡片列表（Inset Grouped 风格）

```css
.card {
  padding: var(--card-padding);
  margin-bottom: var(--card-gap);
  border-radius: var(--radius-md);
}
```

### 全宽顶栏（SubNav / Header）

抵消 `.page` 水平 padding，使顶栏贴边：

```css
margin: calc(-1 * var(--page-margin-y)) calc(-1 * var(--page-margin-x)) var(--space-3);
```

### 浮动按钮（FAB）

```css
bottom: calc(var(--tabbar-h) + var(--space-3) + env(safe-area-inset-bottom, 0px));
```

## 修改检查清单

- [ ] 新间距是否使用 CSS 变量
- [ ] 是否为 8pt 网格倍数（4px 仅作微调）
- [ ] 按钮/Tab 是否 ≥ 44px 高
- [ ] 底部是否考虑 TabBar + Safe Area
- [ ] 全宽组件是否正确抵消 page margin

## 参考链接

- [Layout | Apple HIG](https://developer.apple.com/design/human-interface-guidelines/layout)
- [systemMinimumLayoutMargins](https://developer.apple.com/documentation/uikit/uiviewcontroller/systemminimumlayoutmargins)
