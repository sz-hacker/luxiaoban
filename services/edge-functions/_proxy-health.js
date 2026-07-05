/** EdgeOne 部署健康检查：部署后访问 /_proxy-health 应返回 ok */
export default function onRequest() {
  return new Response('ok', {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
