import type { EChartsOption } from 'echarts'
import type { SourceDistributionItem, TypeDistribution, UrgentItem } from '@/types/api'

/** 紧急任务分布配色（对齐 PC statistics 页） */
export const URGENT_COLORS: Record<string, string> = {
  今天到期: '#d81e06',
  '3天内到期': '#f56c6c',
  '7天内到期': '#ea9518',
  超期未完成: '#6a450e',
  超期已完成: '#52C41A',
}

/** 任务类型配色 */
export const TYPE_COLORS: Record<string, string> = {
  综合任务: '#1890FF',
  个人任务: '#52C41A',
  科室任务: '#FF6B35',
}

/** 来源分布扩展色板 */
export const SOURCE_PALETTE = [
  '#1890FF',
  '#52C41A',
  '#FF6B35',
  '#722ED1',
  '#FAAD14',
  '#13C2C2',
  '#EB2F96',
  '#F5222D',
  '#2F54EB',
  '#73D13D',
]

/** 紧急程度 API 名称映射 */
const URGENT_NAME_MAP: Record<string, string> = {
  今天到期: '今天到期',
  '3天内到期': '3天内到期',
  '7天内到期': '7天内到期',
  已超期: '超期未完成',
  超期未完成: '超期未完成',
  超期已完成: '超期已完成',
}

export interface ChartLegendItem {
  name: string
  value: number
  color: string
  percent?: string
}

/** 解析紧急任务分布数据 */
export function buildUrgentLegend(items: UrgentItem[]): ChartLegendItem[] {
  const template = ['今天到期', '3天内到期', '7天内到期', '超期未完成', '超期已完成']
  const map = new Map<string, number>()
  for (const item of items) {
    const name = URGENT_NAME_MAP[item.statusName] ?? item.statusName
    map.set(name, (map.get(name) ?? 0) + item.count)
  }
  return template.map((name) => ({
    name,
    value: map.get(name) ?? 0,
    color: URGENT_COLORS[name] ?? '#1890FF',
  }))
}

/** 解析任务类型分布 */
export function buildTypeLegend(items: TypeDistribution[]): ChartLegendItem[] {
  const template = ['综合任务', '个人任务', '科室任务']
  const total = items.reduce((sum, item) => sum + item.count, 0)
  return template.map((name) => {
    const found = items.find((item) => item.taskType === name)
    const value = found?.count ?? 0
    return {
      name,
      value,
      color: TYPE_COLORS[name] ?? '#1890FF',
      percent: total > 0 ? `${Math.round((value / total) * 100)}%` : '0%',
    }
  })
}

/** 解析任务来源分布（Top10） */
export function buildSourceLegend(items: SourceDistributionItem[]): ChartLegendItem[] {
  const total = items.reduce((sum, item) => sum + item.count, 0)
  return items.map((item, index) => ({
    name: item.title,
    value: item.count,
    color: SOURCE_PALETTE[index % SOURCE_PALETTE.length]!,
    percent: total > 0 ? `${Math.round((item.count / total) * 100)}%` : '0%',
  }))
}

/** 紧急任务分布 - 横向柱状图 */
export function buildUrgentBarOption(items: ChartLegendItem[]): EChartsOption {
  return {
    grid: { left: 8, right: 36, top: 8, bottom: 8, containLabel: true },
    xAxis: { show: false, type: 'value' },
    yAxis: {
      show: true,
      type: 'category',
      data: items.map((item) => item.name),
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 12, color: '#666' },
    },
    series: [
      {
        type: 'bar',
        data: items.map((item) => ({
          value: item.value,
          itemStyle: {
            color: item.color,
            borderRadius: [0, 6, 6, 0],
          },
        })),
        barWidth: '55%',
        label: {
          show: true,
          position: 'right',
          color: '#333',
          fontSize: 13,
          fontWeight: 600,
        },
      },
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
  }
}

/** 环形图通用配置 */
function buildDonutOption(items: ChartLegendItem[], subText: string): EChartsOption {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  return {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['52%', '72%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: items.map((item) => ({
          name: item.name,
          value: item.value,
          itemStyle: { color: item.color },
        })),
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '40%',
        style: {
          text: String(total),
          fontSize: 24,
          fontWeight: 'bold',
          fill: '#333',
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '54%',
        style: {
          text: subText,
          fontSize: 12,
          fill: '#999',
        },
      },
    ],
  }
}

/** 任务类型分布 - 环形图 */
export function buildTypeDonutOption(items: ChartLegendItem[]): EChartsOption {
  return buildDonutOption(items, '总任务')
}

/** 任务来源分布 - 环形图 */
export function buildSourceDonutOption(items: ChartLegendItem[]): EChartsOption {
  return buildDonutOption(items, '来源前10')
}

/** 近期任务趋势 - 折线图 */
export function buildTrendLineOption(
  dates: string[],
  newTasks: number[],
  completedTasks: number[],
): EChartsOption {
  return {
    legend: {
      top: 0,
      right: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 11, color: '#666' },
    },
    grid: { left: 8, right: 8, top: 32, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 10, color: '#999', rotate: 45, interval: 'auto' },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { type: 'dashed', color: '#eee' } },
      axisLabel: { fontSize: 11, color: '#999' },
    },
    series: [
      {
        name: '新增任务',
        type: 'line',
        smooth: true,
        data: newTasks,
        itemStyle: { color: '#1890FF' },
        lineStyle: { width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.25)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.04)' },
            ],
          },
        },
      },
      {
        name: '完成任务',
        type: 'line',
        smooth: true,
        data: completedTasks,
        itemStyle: { color: '#52C41A' },
        lineStyle: { width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(82, 196, 26, 0.25)' },
              { offset: 1, color: 'rgba(82, 196, 26, 0.04)' },
            ],
          },
        },
      },
    ],
    tooltip: { trigger: 'axis' },
  }
}
