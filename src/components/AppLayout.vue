<template>
  <div class="app-layout">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      v-if="!hideNav"
      :title="currentTitle"
      :left-arrow="showBack"
      @click-left="goBack"
      class="app-nav-bar"
      fixed
      placeholder
    >
      <template #right>
        <van-icon
          v-if="showTabbar"
          name="replay"
          size="20"
          class="nav-refresh-icon"
          @click="onRefreshPage"
        />
      </template>
    </van-nav-bar>

    <!-- 内容区 -->
    <div class="app-content" :class="{ 'with-nav': !hideNav, 'with-tabbar': showTabbar }">
      <slot></slot>
    </div>

    <!-- 底部 TabBar -->
    <van-tabbar
      v-if="showTabbar"
      v-model="activeTab"
      :fixed="true"
      :safe-area-inset-bottom="true"
      active-color="#1989fa"
      inactive-color="#7d7e80"
      @change="onTabChange"
      class="app-tabbar"
    >
      <van-tabbar-item
        v-for="tab in tabs"
        :key="tab.path"
        :icon="tab.meta.icon"
        :name="tab.meta.tabIndex"
      >
        {{ tab.meta.title }}
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script>
import { useAppLayout } from './AppLayout.js'
export default {
  setup() {
    return useAppLayout()
  }
}
</script>

<style src="./AppLayout.css"></style>
