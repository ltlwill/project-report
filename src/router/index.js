/**
 * 路由实例
 * 从 routes.json 读取配置，动态注册路由
 */
import { createRouter, createWebHashHistory } from 'vue-router'
import routesConfig from './routes.json'
import { getToken, getUserInfo } from '@/utils/auth.js'
import { showConfirmDialog } from 'vant'

// 动态导入组件映射
const viewModules = import.meta.glob('../views/**/*.vue')

/**
 * 将 JSON 配置转换为路由对象
 */
function buildRoutes(config) {
  return config.map(item => {
    const componentPath = `../${item.component}.vue`
    return {
      path: item.path,
      name: item.name,
      component: viewModules[componentPath],
      meta: item.meta || {}
    }
  })
}

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: buildRoutes(routesConfig)
})

// 导出 tab 路由配置（供 AppLayout 使用）
export const tabRoutes = routesConfig
  .filter(item => item.meta && item.meta.tab)
  .sort((a, b) => a.meta.tabIndex - b.meta.tabIndex)

// 导出所有路由配置
export const allRoutes = routesConfig

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = getToken()
  const requiresAuth = to.meta.requiresAuth !== false

  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title + ' - 项目工时申报'
  }

  if (requiresAuth && !token) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && token) {
    next({ name: 'Home' })
  } else if (to.meta.requireApprover) {
    // 审批权限校验：无权限用户不能访问审批页
    const userInfo = getUserInfo() || {}
    if (!userInfo.isApprover) {
      next({ name: 'Home' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
