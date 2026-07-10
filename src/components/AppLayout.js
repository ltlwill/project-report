import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { tabRoutes } from '@/router/index.js'
import { useUserStore } from '@/store/modules/user.js'

export function useAppLayout() {
  const router = useRouter()
  const route = useRoute()
  const userStore = useUserStore()

  // 根据用户权限动态过滤 tab
  const tabs = computed(() => {
    return tabRoutes.filter(tab => {
      if (tab.meta.requireApprover) {
        return userStore.isApprover
      }
      return true
    })
  })
  const activeTab = ref(0)

  const currentTitle = computed(() => route.meta.title || '')
  const hideNav = computed(() => route.meta.hideNav === true)
  const showTabbar = computed(() => tabs.value.some(t => t.path === route.path))
  const showBack = computed(() => {
    return !tabs.value.some(t => t.path === route.path) && !route.meta.hideNav
  })

  watch(
    () => route.path,
    (path) => {
      const tab = tabs.value.find(t => t.path === path)
      if (tab) {
        activeTab.value = tab.meta.tabIndex
      }
    },
    { immediate: true }
  )

  function onTabChange(index) {
    const tab = tabs.value.find(t => t.meta.tabIndex === index)
    if (tab && route.path !== tab.path) {
      router.push(tab.path)
    }
  }

  function goBack() {
    router.back()
  }

  async function onRefreshPage() {
    // 先拉取最新用户信息（含权限），再刷新页面
    await userStore.fetchUserInfo()
    window.location.reload()
  }

  return {
    tabs, activeTab,
    currentTitle, hideNav, showTabbar, showBack,
    onTabChange, goBack, onRefreshPage
  }
}
