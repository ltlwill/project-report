<template>
  <div class="records-page" ref="scrollRef">
    <!-- 搜索栏 -->
    <van-search
      v-model="keyword"
      placeholder="搜索填报记录"
      shape="round"
      @search="onSearch"
      @update:model-value="onSearch"
      class="records-search"
    />

    <!-- 状态筛选Tab -->
    <div class="status-filter-bar">
      <!-- <span
        v-for="tab in statusTabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ active: statusFilter === tab.value }"
        @click="statusFilter = tab.value"
      >{{ tab.label }}</span> -->
      <span
        v-for="tab in statusTabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ active: statusFilter === tab.value }"
        @click="handleStatusChange(tab.value)"
      >{{ tab.label }}</span>
    </div>

    <!-- 记录列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-loading v-if="loading && records.length === 0" class="records-loading" />
      <van-empty v-else-if="records.length === 0" description="暂无数据" />
      <div v-else class="records-list">
        <div
          v-for="item in records"
          :key="item.id"
          class="record-card"
        >
          <div class="record-header">
            <div class="record-user">
              <van-icon name="user-o" size="16" />
              <span class="record-name">{{ item.empName }}({{ item.empId }})</span>
            </div>
            <van-tag :type="getStatusType(item.approvalStatus)" plain size="medium">
              {{ getStatusText(item.approvalStatus) }}
            </van-tag>
          </div>

          <div class="record-body">
            <!-- <div class="record-info-row">
              <span class="info-icon"><van-icon name="flag-o" size="14" /></span>
              <span class="info-text">岗&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;位：{{ item.positionName }}</span>
            </div> -->
            <div class="record-info-row">
              <span class="info-icon"><van-icon name="calendar-o" size="14" /></span>
              <span class="info-text">汇报日期：{{ item.reportDate }}</span>
            </div>
            <div class="record-info-row">
              <span class="info-icon"><van-icon name="clock-o" size="14" /></span>
              <span class="info-text">填报时间：{{ formatToDateTime(item.createTime) }}</span>
            </div>
            <div class="record-info-row">
              <span class="info-icon"><van-icon name="bar-chart-o" size="14" /></span>
              <span class="info-text">总&nbsp;&nbsp;工&nbsp;&nbsp;时：{{ item.totalWorkHours }}h</span>
            </div>
            <div class="record-info-row">
              <span class="info-icon"><van-icon name="orders-o" size="14" /></span>
              <span class="info-text">项&nbsp;&nbsp;目&nbsp;&nbsp;数：{{ item.totalCount }}</span>
            </div>
            <!-- <van-button
              v-if="item.approvalStatus === 0"
              :class="operate-button"
              icon="revoke"
              size="small"
              type="warning"
              @click.stop="cancelReport(item)"
            >
              取消
            </van-button> -->
            <van-button
              :class="operate-button"
              icon="delete"
              size="small"
              type="danger"
              @click.stop="deleteReport(item)"
            >
              删除
            </van-button>
          </div>

          <div class="record-footer" @click="goDetail(item.id)">
            <span class="record-hint">查看详情</span>
            <van-icon name="arrow" size="14" color="#969799" />
          </div>
        </div>
      </div>
    </van-pull-refresh>
  </div>
</template>

<script>
import { useRecords } from './RecordsView.js'
export default {
  name: 'Records',
  setup() {
    return useRecords()
  }
}
</script>

<style src="./RecordsView.css"></style>
