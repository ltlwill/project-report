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
            <div class="stat-value">{{ statisticsData?.summaryData?.totalCount || 0}}</div>
            <div class="stat-label">项目总数</div>
          </div>
        </van-col>
        <van-col :span="8">
          <div class="stat-card stat-card-green">
            <div class="stat-value">{{ statisticsData?.summaryData?.weekHours || 0}}</div>
            <div class="stat-label">本周工时</div>
          </div>
        </van-col>
        <van-col :span="8">
          <div class="stat-card stat-card-orange">
            <div class="stat-value">{{ statisticsData?.summaryData?.monthHours || 0}}</div>
            <div class="stat-label">本月工时</div>
          </div>
        </van-col>
      </van-row>
    </div>
    <!-- 工时日历 -->
    <div class="home-calendar-section">
      <div class="calendar-header">
        <div class="section-title">
          工时日历
          <van-loading v-if="calendarLoading" size="12" class="calendar-loading" />
        </div>
        <div class="calendar-month-switch">
          <span v-if="!isCurrentMonth" class="calendar-today-btn" @click="goCurrentMonth">回到本月</span>
          <van-icon name="arrow-left" @click="changeMonth(-1)" />
          <span class="calendar-month-text">{{ calendarMonthLabel }}</span>
          <van-icon name="arrow" @click="changeMonth(1)" />
        </div>
      </div>
      <div class="calendar-weekdays">
        <span v-for="w in weekLabels" :key="w">{{ w }}</span>
      </div>
      <div class="calendar-grid">
        <div
          v-for="cell in calendarDays"
          :key="cell.key"
          class="calendar-cell"
          :class="cell.day ? [calendarHasStatus ? `is-${cell.status}` : '', { 'is-today': cell.isToday }] : 'is-empty'"
        >
          <template v-if="cell.day">
            <span class="calendar-day">{{ cell.day }}</span>
            <span class="calendar-dot"></span>
          </template>
        </div>
      </div>
      <div class="calendar-footer">
        <div v-if="calendarHasStatus" class="calendar-legend">
          <span class="legend-item"><i class="legend-dot legend-filled"></i>已填报</span>
          <span class="legend-item"><i class="legend-dot legend-missed"></i>未填报</span>
          <span class="legend-item"><i class="legend-dot legend-invalid"></i>错填</span>
          <span class="legend-item"><i class="legend-dot legend-none"></i>无需填报</span>
        </div>
        <van-icon name="question-o" class="calendar-help-icon" @click="showCalendarHelp = true" />
      </div>
      <van-dialog
        v-model:show="showCalendarHelp"
        title="填报状态说明"
        confirm-button-text="知道了"
        :show-cancel-button="false"
        teleport="body"
      >
        <div class="calendar-help-list">
          <div class="calendar-help-item">
            <i class="calendar-help-dot help-dot-filled"></i>
            <span class="calendar-help-text"><b class="help-label help-label-filled">已填报</b>：指此日期需要填报并且已经填报<span class="help-status-ok">(正常状态)</span></span>
          </div>
          <div class="calendar-help-item">
            <i class="calendar-help-dot help-dot-missed"></i>
            <span class="calendar-help-text"><b class="help-label help-label-missed">未填报</b>：指此日期需要填报但是还未填报<span class="help-status-bad">(异常状态)</span></span>
          </div>
          <div class="calendar-help-item">
            <i class="calendar-help-dot help-dot-invalid"></i>
            <span class="calendar-help-text"><b class="help-label help-label-invalid">错填</b>：指此日期无需填报但是已经填报<span class="help-status-bad">(异常状态)</span></span>
          </div>
          <div class="calendar-help-item">
            <i class="calendar-help-dot help-dot-none"></i>
            <span class="calendar-help-text"><b class="help-label help-label-none">无需填报</b>：指此日期无需填报且未填报<span class="help-status-ok">(正常状态)</span></span>
          </div>
        </div>
      </van-dialog>
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
