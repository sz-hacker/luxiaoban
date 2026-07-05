/** 登录后默认跳转路径 */
export const DEFAULT_AUTH_REDIRECT = '/cases'

/** 解析登录成功后的跳转路径 */
export function resolveAuthRedirect(redirect: unknown): string {
  return typeof redirect === 'string' && redirect.startsWith('/')
    ? redirect
    : DEFAULT_AUTH_REDIRECT
}
