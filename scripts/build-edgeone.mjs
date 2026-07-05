/**
 * 打包 EdgeOne 部署目录：静态资源 + edge-functions + cloud-functions
 * 源文件位于 services/，产物输出到仓库根 edgeone/
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const vueRoot = join(repoRoot, 'vue')
const servicesRoot = join(repoRoot, 'services')
const outDir = join(repoRoot, 'edgeone')

const edgeSrc = join(servicesRoot, 'edge-functions')
const cloudSrc = join(servicesRoot, 'cloud-functions')

if (!existsSync(join(vueRoot, 'package.json'))) {
  console.error('未找到 vue/ 前端工程')
  process.exit(1)
}
if (!existsSync(edgeSrc)) {
  console.error('未找到 services/edge-functions')
  process.exit(1)
}
if (!existsSync(cloudSrc)) {
  console.error('未找到 services/cloud-functions')
  process.exit(1)
}

console.log('>>> 构建前端 vue/dist …')
execSync('npm run build:edgeone', { cwd: vueRoot, stdio: 'inherit' })

const distDir = join(vueRoot, 'dist')
if (!existsSync(distDir)) {
  console.error('前端构建失败：vue/dist 不存在')
  process.exit(1)
}

console.log('>>> 组装 edgeone/ 部署包 …')
rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

cpSync(distDir, join(outDir, 'dist'), { recursive: true })
cpSync(edgeSrc, join(outDir, 'edge-functions'), { recursive: true })
cpSync(cloudSrc, join(outDir, 'cloud-functions'), { recursive: true })

writeFileSync(
  join(outDir, 'edgeone.json'),
  `${JSON.stringify(
    {
      outputDirectory: 'dist',
      nodeVersion: '20.18.0',
      cloudFunctions: {
        nodejs: { maxDuration: 120 },
      },
      headers: [
        {
          source: '/assets/*.mjs',
          headers: [{ key: 'Content-Type', value: 'application/javascript' }],
        },
        {
          source: '/pdf.worker.min.js',
          headers: [{ key: 'Content-Type', value: 'application/javascript' }],
        },
      ],
    },
    null,
    2,
  )}\n`,
)

console.log('')
console.log(`EdgeOne 部署包已生成：${outDir}`)
console.log('请将 edgeone/ 整个文件夹上传到 EdgeOne 控制台部署。')
