<template>
  <div class="statistics-page">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <!-- 当前登录人信息 -->
      <div class="statistics-header">
        <h2 class="user-name">{{ apiEmpName || empName || '用户' }}</h2>
        <p class="user-empid">工号：{{ empId }}</p>
      </div>

      <!-- 时间区间选择 -->
      <div class="date-range-bar" @click="showCalendar = true">
        <van-icon name="calendar-o" class="date-range-icon" />
        <span class="date-range-text">{{ startDate }} 至 {{ endDate }}</span>
        <van-icon name="arrow-down" size="14" color="#969799" />
      </div>

      <!-- 快捷时间区间 -->
      <div class="quick-range-bar">
        <span
          v-for="item in quickRanges"
          :key="item.key"
          class="quick-range-chip"
          :class="{ 'quick-range-chip--active': activeQuickRange === item.key }"
          @click="onQuickRange(item.key)"
        >{{ item.label }}</span>
      </div>

      <!-- 概要信息 -->
      <div class="statistics-summary">
        <van-row :gutter="10">
          <van-col :span="12">
            <div class="summary-card">
              <div class="statistics-summary-value summary-value-blue">
                {{ totalHours.toFixed(1) }}<span class="summary-unit">h</span>
              </div>
              <div class="summary-label">总工时</div>
            </div>
          </van-col>
          <van-col :span="12">
            <div class="summary-card">
              <div class="statistics-summary-value summary-value-green">{{ projectCount }}</div>
              <div class="summary-label">总项目数</div>
            </div>
          </van-col>
        </van-row>
      </div>

      <!-- 项目明细 -->
      <div class="statistics-detail">
        <div class="section-title-row">
          <div class="section-title">项目明细</div>
          <div v-if="recordList.length > 0" class="export-btn" @click="showExportMenu = true">
            <van-icon name="share-o" />
            <span>分享</span>
          </div>
        </div>
        <van-loading v-if="loading && recordList.length === 0" class="statistics-loading" />
        <van-empty v-else-if="loadFailed" image="network" description="统计数据加载失败">
          <van-button round type="primary" size="small" @click="loadStatistics">重新加载</van-button>
        </van-empty>
        <van-empty v-else-if="recordList.length === 0" description="暂无统计数据" />
        <div v-else class="detail-list">
          <div v-for="item in recordList" :key="item.projectName" class="detail-item">
            <div class="detail-row">
              <span class="detail-name">{{ item.projectName }}</span>
              <span class="detail-hours">{{ (Number(item.workHours) || 0).toFixed(1) }}h</span>
            </div>
            <div class="detail-progress-row">
              <van-progress
                :percentage="getRatioPercent(item)"
                :show-pivot="false"
                :stroke-width="8"
                color="#1989fa"
                track-color="#eef4fd"
                class="detail-progress"
              />
              <span class="detail-ratio">{{ getRatioPercent(item).toFixed(2) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </van-pull-refresh>

    <!-- 时间区间选择弹窗 -->
    <van-popup
      v-model:show="showCalendar"
      position="bottom"
      round
      teleport="body"
      :z-index="2000"
      :style="{ height: '75%' }"
      :safe-area-inset-bottom="true"
    >
      <van-calendar
        :poppable="false"
        type="range"
        color="#1989fa"
        confirm-text="确定"
        :min-date="minDate"
        :max-date="maxDate"
        :default-date="defaultRange"
        :allow-same-day="true"
        :style="{ height: '100%' }"
        @confirm="onDateRangeConfirm"
      />
    </van-popup>

    <!-- 凭证图预览弹窗（生成后长按保存到相册） -->
    <van-popup
      v-model:show="showCert"
      position="bottom"
      round
      teleport="body"
      :z-index="2000"
      :style="{ height: '88%' }"
      :safe-area-inset-bottom="true"
    >
      <div class="cert-popup-content">
        <div class="cert-popup-header">
          <span class="cert-popup-title">图片预览</span>
          <van-icon name="cross" class="cert-popup-close" @click="showCert = false" />
        </div>

        <div v-if="generatingCert" class="cert-loading">
          <van-loading />
          <span>正在生成凭证图…</span>
        </div>

        <template v-else>
          <div class="cert-hint">
            <van-icon name="photo-o" />
            <span>长按图片保存到相册</span>
          </div>
          <div class="cert-images">
            <img
              v-for="(url, index) in certImages"
              :key="index"
              :src="url"
              class="cert-image"
              alt="工时统计图片"
            />
            <div v-if="certImages.length > 1" class="cert-pages-tip">
              共 {{ certImages.length }} 张，请逐张长按保存
            </div>
          </div>
        </template>
      </div>
    </van-popup>

    <!-- 导出菜单（复制清单 / 存为图片） -->
    <van-popup
      v-model:show="showExportMenu"
      position="bottom"
      round
      teleport="body"
      :z-index="2000"
      :lazy-render="false"
      :safe-area-inset-bottom="true"
    >
      <div class="export-menu">
        <div class="export-menu-item" data-clip-type="names">
          <van-icon name="notes-o" />
          <span>复制项目名称</span>
          <span class="export-menu-sub">每行一个</span>
        </div>
        <div class="export-menu-item" data-clip-type="detail">
          <van-icon name="records-o" />
          <span>复制项目明细</span>
          <span class="export-menu-sub">可粘贴到 Excel</span>
        </div>
        <div class="export-menu-item" @click="onExportMenuAction('image')">
          <van-icon name="photo-o" />
          <span>存为图片</span>
          <span class="export-menu-sub">生成完整长图</span>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { useStatistics } from './StatisticsView.js'
export default {
  name: 'Statistics',
  setup() {
    return useStatistics()
  }
}
</script>

<style src="./StatisticsView.css"></style>
