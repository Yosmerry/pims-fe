import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import { createPinia } from 'pinia'

import 'element-plus/dist/index.css'
import './styles/main.css'
import './styles/layout.css'
import './styles/shared-page.css'
import './styles/inventory.css'
import './styles/categories.css'
import './styles/locations.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
