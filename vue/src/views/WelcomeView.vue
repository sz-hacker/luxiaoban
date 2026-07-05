<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

/** 核心数据指标 */
const stats = [
  { value: '139', unit: '份', label: '累计评查案卷数' },
  { value: '97.6', unit: '%', label: 'AI评查准确率' },
  { value: '85', unit: '%', label: '平均节省时长' },
  { value: '546', unit: '项', label: '发现问题数' },
]

/** 三步流程 */
const steps = [
  { step: '01', title: '上传案卷', desc: '支持批量上传，自动识别案卷类型', icon: 'upgrade' },
  { step: '02', title: '智能评查', desc: 'AI逐项比对法规标准，自动标注问题', icon: 'scan' },
  { step: '03', title: '结果报告', desc: '生成评查报告，支持导出与归档', icon: 'description' },
]

/** 平台能力 */
const features = [
  {
    title: 'AI智能评查',
    desc: '自动识别案卷问题，评查效率提升300%',
    icon: 'fire-o',
    accent: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
  },
  {
    title: '执法标准统一',
    desc: '内置法规库与评查标准，确保评查一致性',
    icon: 'balance-o',
    accent: 'linear-gradient(135deg, #13c2c2 0%, #1677ff 100%)',
  },
  {
    title: '数据分析报告',
    desc: '多维度统计分析，辅助执法决策优化',
    icon: 'chart-trending-o',
    accent: 'linear-gradient(135deg, #722ed1 0%, #eb2f96 100%)',
  },
]

/** 立即体验：已登录进 AI 助手，未登录进登录页 */
function handleStart() {
  router.push(userStore.isLoggedIn ? '/ai' : '/login')
}

/** 跳转 AI 助手 */
function handleExplore() {
  router.push(userStore.isLoggedIn ? '/ai' : '/login')
}
</script>

<template>
  <div class="welcome-scroll scroll-y">
    <!-- Hero：渐变光晕 + 网格背景 -->
    <section class="hero">
      <div class="hero-bg" aria-hidden="true">
        <div class="orb orb-a" />
        <div class="orb orb-b" />
        <div class="grid-overlay" />
      </div>

      <div class="hero-body text-inset">
        <span class="hero-badge">AI 智能评查</span>
        <h1 class="hero-title">
          <span class="title-line">智能案卷</span>
          <span class="title-line title-accent">评查系统</span>
        </h1>
        <p class="hero-desc">以 AI 赋能为核心，让每一份案卷经得起检验</p>
        <p class="hero-sub">速审 · 精判 · 立标 · 高效执法新体验</p>

        <div class="hero-actions">
          <button type="button" class="btn-cta" @click="handleStart">
            立即体验
            <van-icon name="arrow" class="btn-arrow" />
          </button>
          <button type="button" class="btn-outline" @click="handleExplore">了解更多</button>
        </div>
      </div>
    </section>

    <!-- 数据指标：玻璃卡片 -->
    <section class="section stats-section text-inset">
      <div class="section-head">
        <span class="section-badge">核心数据</span>
        <h2 class="section-title">用数据说话</h2>
      </div>
      <div class="stats-grid">
        <div v-for="item in stats" :key="item.label" class="stat-card">
          <div class="stat-num">
            {{ item.value }}<span class="unit">{{ item.unit }}</span>
          </div>
          <div class="stat-label">{{ item.label }}</div>
        </div>
      </div>
    </section>

    <!-- 三步流程 -->
    <section class="section steps-section text-inset">
      <div class="section-head">
        <span class="section-badge">快速上手</span>
        <h2 class="section-title">仅需 3 步，2 分钟完成评查</h2>
      </div>
      <div class="steps-list">
        <article v-for="item in steps" :key="item.step" class="step-card">
          <div class="step-icon-wrap">
            <van-icon :name="item.icon" size="22" color="#fff" />
          </div>
          <div class="step-content">
            <span class="step-num">STEP {{ item.step }}</span>
            <h3 class="step-title">{{ item.title }}</h3>
            <p class="step-desc">{{ item.desc }}</p>
          </div>
        </article>
      </div>
    </section>

    <!-- 平台能力 -->
    <section class="section features-section text-inset">
      <div class="section-head">
        <span class="section-badge">平台优势</span>
        <h2 class="section-title">为什么选择我们</h2>
        <p class="section-desc">全方位 AI 案卷评查解决方案，助力执法规范化</p>
      </div>
      <div class="features-list">
        <article
          v-for="item in features"
          :key="item.title"
          class="feature-card"
          :style="{ '--feature-accent': item.accent }"
        >
          <div class="feature-icon">
            <van-icon :name="item.icon" size="24" color="#1677ff" />
          </div>
          <div class="feature-body">
            <h3 class="feature-title">{{ item.title }}</h3>
            <p class="feature-desc">{{ item.desc }}</p>
          </div>
          <van-icon name="arrow" class="feature-arrow" />
        </article>
      </div>
    </section>

    <!-- 底部 CTA -->
    <section class="cta-banner text-inset">
      <div class="cta-inner">
        <h2 class="cta-title">准备好开启智能评查之旅了吗？</h2>
        <p class="cta-desc">让 AI 赋能执法评查，提升效率与规范性</p>
        <button type="button" class="btn-cta btn-cta-light" @click="handleStart">
          立即体验
          <van-icon name="arrow" class="btn-arrow" />
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.welcome-scroll {
  padding: 0 0 var(--page-margin-bottom);
  background: #f5f7fb;
}

/* ── Hero ── */
.hero {
  position: relative;
  overflow: hidden;
  padding: var(--space-5) 0 var(--space-4);
  margin-bottom: var(--space-3);
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(165deg, #eef4ff 0%, #f8f9ff 45%, #fff 100%);
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.55;
  animation: float 8s ease-in-out infinite;
}

.orb-a {
  width: clamp(120px, 40vw, 200px);
  height: clamp(120px, 40vw, 200px);
  top: -20%;
  right: -10%;
  background: radial-gradient(circle, #4096ff 0%, transparent 70%);
}

.orb-b {
  width: clamp(100px, 35vw, 160px);
  height: clamp(100px, 35vw, 160px);
  bottom: 10%;
  left: -15%;
  background: radial-gradient(circle, #722ed1 0%, transparent 70%);
  animation-delay: -4s;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(22, 119, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(22, 119, 255, 0.04) 1px, transparent 1px);
  background-size: clamp(20px, 6vw, 32px) clamp(20px, 6vw, 32px);
  mask-image: linear-gradient(180deg, #000 30%, transparent 100%);
}

.hero-body {
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  margin-bottom: var(--space-3);
  font-size: var(--font-xs);
  font-weight: 600;
  color: #1677ff;
  background: rgba(22, 119, 255, 0.1);
  border: 1px solid rgba(22, 119, 255, 0.2);
  border-radius: 999px;
  letter-spacing: 0.04em;
}

.hero-title {
  margin: 0 0 var(--space-2);
  line-height: 1.15;
}

.title-line {
  display: block;
  font-size: clamp(26px, 8vw, 36px);
  font-weight: 800;
  color: #1a1a2e;
  letter-spacing: -0.02em;
}

.title-accent {
  background: linear-gradient(135deg, #1677ff 0%, #722ed1 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-desc {
  margin: 0 0 var(--space-1);
  font-size: var(--font-md);
  color: #434343;
  line-height: 1.5;
}

.hero-sub {
  margin: 0 0 var(--space-4);
  font-size: var(--font-sm);
  color: var(--text-secondary);
  letter-spacing: 0.08em;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.btn-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-height: var(--touch-min);
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-md);
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #1677ff 0%, #531dab 100%);
  border: none;
  border-radius: 999px;
  box-shadow: 0 4px 20px rgba(22, 119, 255, 0.35);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-cta:active {
  transform: scale(0.97);
  box-shadow: 0 2px 12px rgba(22, 119, 255, 0.3);
}

.btn-arrow {
  font-size: var(--font-sm);
  transition: transform 0.2s;
}

.btn-cta:active .btn-arrow {
  transform: translateX(2px);
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--touch-min);
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-md);
  font-weight: 500;
  color: #434343;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  backdrop-filter: blur(8px);
  cursor: pointer;
}

.btn-outline:active {
  background: #fff;
}

/* ── Section 通用 ── */
.section {
  margin-bottom: var(--space-4);
}

.section-head {
  margin-bottom: var(--space-3);
}

.section-badge {
  display: inline-block;
  margin-bottom: var(--space-1);
  font-size: var(--font-xs);
  font-weight: 600;
  color: #722ed1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.section-title {
  margin: 0;
  font-size: var(--font-lg);
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.3;
}

.section-desc {
  margin: var(--space-1) 0 0;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  line-height: 1.4;
}

/* ── Stats ── */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}

.stat-card {
  padding: var(--space-3);
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-md);
  box-shadow: 0 2px 16px rgba(22, 119, 255, 0.06);
  backdrop-filter: blur(12px);
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:active {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(22, 119, 255, 0.12);
}

.stat-num {
  font-size: var(--font-display);
  font-weight: 800;
  background: linear-gradient(135deg, #1677ff, #531dab);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
}

.unit {
  font-size: var(--font-xs);
  font-weight: 500;
  -webkit-text-fill-color: #722ed1;
}

.stat-label {
  margin-top: var(--space-1);
  font-size: var(--font-xs);
  color: var(--text-secondary);
  line-height: 1.3;
}

/* ── Steps ── */
.steps-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.step-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border-left: 3px solid transparent;
  border-image: linear-gradient(180deg, #1677ff, #722ed1) 1;
}

.step-icon-wrap {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(40px, 12vw, 48px);
  height: clamp(40px, 12vw, 48px);
  background: linear-gradient(135deg, #1677ff 0%, #531dab 100%);
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.25);
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-num {
  display: block;
  margin-bottom: var(--space-1);
  font-size: var(--font-xs);
  font-weight: 700;
  color: #1677ff;
  letter-spacing: 0.06em;
}

.step-title {
  margin: 0 0 var(--space-1);
  font-size: var(--font-md);
  font-weight: 600;
  color: #1a1a2e;
}

.step-desc {
  margin: 0;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  line-height: 1.4;
}

/* ── Features ── */
.features-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.feature-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: var(--feature-accent);
}

.feature-card:active {
  transform: scale(0.99);
  box-shadow: 0 4px 20px rgba(22, 119, 255, 0.1);
}

.feature-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(40px, 12vw, 48px);
  height: clamp(40px, 12vw, 48px);
  background: linear-gradient(135deg, rgba(22, 119, 255, 0.08), rgba(114, 46, 209, 0.08));
  border-radius: var(--radius-sm);
}

.feature-body {
  flex: 1;
  min-width: 0;
}

.feature-title {
  margin: 0 0 var(--space-1);
  font-size: var(--font-md);
  font-weight: 600;
  color: #1a1a2e;
}

.feature-desc {
  margin: 0;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  line-height: 1.4;
}

.feature-arrow {
  flex-shrink: 0;
  color: #bfbfbf;
  font-size: var(--font-sm);
}

/* ── CTA Banner ── */
.cta-banner {
  padding-bottom: var(--space-3);
}

.cta-inner {
  padding: var(--space-4) var(--space-3);
  text-align: center;
  background: linear-gradient(135deg, #10239e 0%, #531dab 50%, #1677ff 100%);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 32px rgba(22, 119, 255, 0.25);
  position: relative;
  overflow: hidden;
}

.cta-inner::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.06) 0%, transparent 40%);
  pointer-events: none;
}

.cta-title {
  position: relative;
  margin: 0 0 var(--space-2);
  font-size: var(--font-lg);
  font-weight: 700;
  color: #fff;
  line-height: 1.35;
}

.cta-desc {
  position: relative;
  margin: 0 0 var(--space-3);
  font-size: var(--font-sm);
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.4;
}

.btn-cta-light {
  position: relative;
  background: #fff;
  color: #1677ff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.btn-cta-light:active {
  background: #f0f5ff;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(8px, -12px) scale(1.05);
  }
}
</style>
