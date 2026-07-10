<template>
  <div class="home-page">
    <!-- 欢迎区 -->
    <div class="home-welcome">
      <p class="welcome-text">欢迎回来，{{ empName || '用户' }}</p>
      <p class="welcome-date">{{ currentDate }}</p>
    </div>

    <!-- 统计卡片 -->
    <div class="home-stats">
      <van-row :gutter="10">
        <van-col :span="8">
          <div class="stat-card stat-card-blue">
            <div class="stat-value">{{ stats.projectCount }}</div>
            <div class="stat-label">项目总数</div>
          </div>
        </van-col>
        <van-col :span="8">
          <div class="stat-card stat-card-green">
            <div class="stat-value">{{ stats.weekHours }}</div>
            <div class="stat-label">本周工时</div>
          </div>
        </van-col>
        <van-col :span="8">
          <div class="stat-card stat-card-orange">
            <div class="stat-value">{{ stats.monthHours }}</div>
            <div class="stat-label">本月工时</div>
          </div>
        </van-col>
      </van-row>
    </div>

    <!-- 工时趋势图表 -->
    <div class="home-chart-section">
      <div class="section-title">本周工时趋势</div>
      <div ref="chartRef" class="chart-container"></div>
    </div>

    <!-- 项目工时分布（饼图） -->
    <div class="home-chart-section">
      <div class="section-title">项目工时分布</div>
      <div ref="pieChartRef" class="chart-container"></div>
    </div>

    <!-- 月度工时趋势（折线图） -->
    <div class="home-chart-section">
      <div class="section-title">近六个月工时趋势</div>
      <div ref="lineChartRef" class="chart-container"></div>
    </div>

    <!-- 快捷入口 -->
    <!--  
    <div class="home-shortcuts">
      <div class="section-title">快捷操作</div>
      <van-row :gutter="10">
        <van-col :span="6" v-for="item in shortcuts" :key="item.name">
          <div class="shortcut-item" @click="goTo(item.path)">
            <van-icon :name="item.icon" size="28" :color="item.color" />
            <span class="shortcut-label">{{ item.name }}</span>
          </div>
        </van-col>
      </van-row>
    </div>
    -->

    <!-- 最近填报 -->
    <!--
    <div class="home-recent">
      <div class="section-title">最近填报</div>
      <van-empty v-if="recentList.length === 0" description="暂无填报记录" image="search" />
      <div v-else class="recent-list">
        <div class="recent-item" v-for="item in recentList" :key="item.id">
          <div class="recent-info">
            <span class="recent-date">{{ item.reportDate }}</span>
            <span class="recent-hours">{{ item.totalHours }}h</span>
          </div>
          <van-tag :type="getStatusType(item.status)" plain>
            {{ getStatusText(item.status) }}
          </van-tag>
        </div>
      </div>
    </div>
    -->
  </div>
</template>

<script>
import { useHome } from './HomeView.js'
export default {
  name: 'Home',
  setup() {
    return useHome()
  }
}
</script>

<style src="./HomeView.css"></style>
