import './assets/main.css'
import 'vant/lib/index.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setupRouteTransition } from '@/composables/useRouteTransition'

setupRouteTransition()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
