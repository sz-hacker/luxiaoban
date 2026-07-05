import * as XLSX from '@e965/xlsx'

/** Excel 列头定义（与 Web File 组件 head 一致） */
export interface ExcelColumnHead {
  props: string
  label: string
  width?: string
}

/**
 * 将 head + data 导出为 xlsx 并触发浏览器下载
 * 逻辑对齐 Web 端 CustomTable 导出：首行 label，后续行按 props 取值
 */
export function downloadExcelFromTableData(
  head: ExcelColumnHead[],
  data: Record<string, unknown>[],
  filename: string,
): void {
  if (!head.length || !data.length) {
    throw new Error('表格数据不完整，无法导出')
  }

  /** 表头行：取各列 label */
  const headerRow = head.map((col) => col.label)
  /** 数据行：按 props 字段顺序取值 */
  const dataRows = data.map((row) =>
    head.map((col) => {
      const val = row[col.props]
      return val === null || val === undefined ? '' : val
    }),
  )

  const sheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1')

  /** 确保文件名带 .xlsx 后缀 */
  const safeName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  XLSX.writeFile(workbook, safeName)
}
