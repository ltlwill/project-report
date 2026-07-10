/**
 * 应用入口
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import pinia from './store/index.js'

// 全局样式
import './assets/styles/global.css'

// Vant 样式（按需引入由 unplugin-vue-components 处理）
import 'vant/lib/index.css'

const app = createApp(App)

app.use(router)
app.use(pinia)

app.mount('#app')
