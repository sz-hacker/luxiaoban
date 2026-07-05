import { fileURLToPath, URL } from 'node:url'
import { copyFileSync, createReadStream } from 'node:fs'
import type { Connect, PreviewServer, ViteDevServer } from 'vite'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'

/** pdf.js worker 源文件（.mjs 内容以 .js 路径发布，避免 EdgeOne MIME 问题） */
const PDF_WORKER_SRC = fileURLToPath(
  new URL('./node_modules/pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
)

/**
 * 开发/构建均提供 pdf.worker.min.js：
 * - dev：中间件直接输出 worker，避免 404 回退为 index.html（text/html）
 * - build：复制到 dist 根目录
 */
function copyPdfWorkerPlugin() {
  /** 判断是否为 pdf.js worker 请求 */
  const isWorkerRequest = (url: string) => {
    const path = url.split('?')[0] ?? ''
    return path === '/pdf.worker.min.js' || path.endsWith('/pdf.worker.min.js')
  }

  /** 以 application/javascript 响应 worker 脚本 */
  const servePdfWorker: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url || !isWorkerRequest(req.url)) {
      next()
      return
    }
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
    createReadStream(PDF_WORKER_SRC).pipe(res)
  }

  return {
    name: 'copy-pdf-worker',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(servePdfWorker)
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(servePdfWorker)
    },
    closeBundle() {
      const dest = fileURLToPath(new URL('./dist/pdf.worker.min.js', import.meta.url))
      copyFileSync(PDF_WORKER_SRC, dest)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  /** GitHub Pages 子路径部署时设为 /luxiaoban/，EdgeOne 等根路径部署用默认 / */
  base: process.env.VITE_BASE || '/',
  plugins: [
    vue(),
    /** Vant 组件按需自动引入 */
    Components({
      resolvers: [VantResolver()],
    }),
    copyPdfWorkerPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    /** GitHub Pages 子路径部署时关闭 modulePreload，避免 CSS preload 404 */
    modulePreload: process.env.VITE_BASE ? false : undefined,
  },
  server: {
    /** 监听 0.0.0.0，允许局域网通过 IP（如 192.168.31.44:5173）访问 */
    host: true,
    port: 5173,
    proxy: {
      /**
       * 源站：https://ai-test.luxiaoban.com/hb（Web H5 转移动端项目）
       * 测试账号：13144556600 / 2UYPafNz
       */
      '/hb/api': {
        target: 'https://ai-test.luxiaoban.com',
        changeOrigin: true,
        /** SSE 流式对话：避免 dev 代理缓冲导致 H5 无法逐段展示 */
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            if (req.url?.includes('agent-chat/chat')) {
              delete proxyRes.headers['content-length']
              res.setHeader('Cache-Control', 'no-cache, no-transform')
              res.setHeader('X-Accel-Buffering', 'no')
            }
          })
        },
      },
      /** 上传 Cloud Function 代理（与生产 /hb-cloud 路径一致） */
      '/hb-cloud': {
        target: 'https://ai-test.luxiaoban.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hb-cloud/, '/hb'),
      },
      /** PDF 同源代理，供 pdf.js 预览百度云 BOS 文件 */
      '/pdf-proxy': {
        target: 'https://huanbao.bj.bcebos.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pdf-proxy/, ''),
      },
    },
  },
})
