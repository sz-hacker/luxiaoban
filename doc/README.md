# 智能案卷评查 — 项目说明

将 [https://ai-test.luxiaoban.com/hb](https://ai-test.luxiaoban.com/hb) Web H5 改造为移动端 Vue 3 项目。

## 测试环境

| 项 | 值 |
|---|---|
| 源站地址 | https://ai-test.luxiaoban.com/hb |
| 测试账号 | 13144556600 |
| 测试密码 | 2UYPafNz |

## 目录结构

| 目录 | 说明 |
|---|---|
| `vue/` | 前端 H5 工程（Vite + Vue 3） |
| `services/` | EdgeOne 后端函数 |
| `doc/` | 设计文档 |
| `edgeone/` | **打包产物**（`npm run build` 生成，上传 EdgeOne 部署） |

## 本地开发

```bash
npm install
npm run dev
```

开发服务器默认 `http://localhost:5173`，API 通过 Vite 代理转发至测试源站。

## EdgeOne 部署

```bash
npm install
npm run build
```

构建完成后，将 `edgeone/` 整个文件夹上传到 EdgeOne 控制台。

部署包包含：

- `dist/` — 前端静态资源
- `edge-functions/` — Edge Function
- `cloud-functions/` — Cloud Function
- `edgeone.json` — EdgeOne 配置
