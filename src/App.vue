<template>
  <AppLayout v-if="showLayout">
    <router-view v-slot="{ Component, route }">
      <keep-alive :include="keepAliveNames">
        <component :is="Component" :key="route.name" />
      </keep-alive>
    </router-view>
  </AppLayout>
  <router-view v-else />
</template>

<script>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import routes from '@/router/routes.json'
import { useUserStore } from '@/store/modules/user.js'
import { getToken } from '@/utils/auth.js'

export default {
  components: { AppLayout },
  setup() {
    const route = useRoute()
    const userStore = useUserStore()

    // 登录页不使用 AppLayout
    const showLayout = computed(() => {
      return route.name !== 'Login'
    })

    // 需要被 keep-alive 缓存的组件名列表（与组件 name 对应）
    const keepAliveNames = routes
      .filter(r => r.meta && r.meta.keepAlive)
      .map(r => r.name)

    // 页面加载/刷新时，如果已登录，拉取最新用户信息（含权限）
    onMounted(() => {
      if (getToken()) {
        userStore.fetchUserInfo()
      }
    })

    return { showLayout, keepAliveNames }
  }
}
</script>

<style src="./App.css"></style>
