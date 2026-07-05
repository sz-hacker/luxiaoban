# services — EdgeOne 后端函数

| 目录 | 说明 |
|---|---|
| `edge-functions/` | Edge Function（API 代理、PDF 同源代理、健康检查） |
| `cloud-functions/` | Cloud Function（大文件上传） |

## edge-functions

| 路径 | 路由 | 作用 |
|---|---|---|
| `hb/api/[[default]].js` | `/hb/api/*` | API 反向代理到源站 |
| `pdf-proxy/[[default]].js` | `/pdf-proxy/*` | 百度云 BOS PDF 同源代理（供 pdf.js 预览） |
| `_proxy-health.js` | `/_proxy-health` | 部署健康检查 |

## cloud-functions

| 路径 | 路由 | 作用 |
|---|---|---|
| `hb-cloud/api/v1/upload/one.js` | `/hb-cloud/api/v1/upload/one` | 大文件上传代理（≤6MB） |

## PDF 预览

前端使用 **pdf.js 客户端渲染**，BOS 文件经 `pdf-proxy` 同源转发，无需独立转图服务。
