import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { setupAuthGuard } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

setupAuthGuard(router)

export default router
