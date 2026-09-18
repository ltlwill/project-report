<template>
  <div class="approval-page" ref="scrollRef">
    <!-- 可滚动区域 -->
    <!-- <div class="approval-scroll" ref="scrollRef"> -->
      <!-- 搜索栏 -->
      <van-search
        v-model="keyword"
        placeholder="搜索审批记录"
        shape="round"
        @search="onSearch"
        @update:model-value="onSearch"
        class="approval-search"
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

      <!-- 审批列表 -->
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-loading v-if="loading && records.length === 0" class="approval-loading" />
        <van-empty v-else-if="records.length === 0" description="暂无数据" />
        <div v-else class="approval-list">
          <div
            v-for="item in records"
            :key="item.id"
            class="approval-card"
          >
            <!-- 卡片主体 -->
            <div class="approval-card-main">
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

                <van-button
                  v-if="item.approvalStatus === 0"
                  :class="operate-button"
                  icon="edit"
                  size="small"
                  type="primary"
                  @click.stop="openApproval(item)"
                >
                  审批
                </van-button>
              </div>

              <div class="record-footer" @click="goDetail(item.id)">
                <span class="record-hint">查看详情</span>
                <van-icon name="arrow" size="14" color="#969799" />
              </div>
            </div>

            <!-- 审批操作区：仅未审批时显示审批按钮 -->
            <!-- <div v-if="item.approvalStatus === 0" class="approval-actions">
              <van-button
                size="small"
                type="primary"
                @click.stop="openApproval(item)"
              >
                审批
              </van-button>
            </div> -->
          </div>
        </div>
      </van-pull-refresh>
    <!-- </div> -->

    <!-- 底部一键审批按钮：仅在「未审批」 Tab 且有记录时显示 -->
    <div v-if="statusFilter === 0 && pendingCount > 0" class="batch-approve-bar">
      <van-button
        type="primary"
        block
        round
        @click="openBatchApproval"
      >
        一键审批（{{ pendingCount }}条）
      </van-button>
    </div>

    <!-- 单条审批弹窗 -->
    <van-dialog
      v-model:show="showDialog"
      title="审批"
      show-cancel-button
      :before-close="onDialogConfirm"
    >
      <div class="approval-dialog-content">
        <div class="approval-result-row">
          <span class="approval-result-label">审批结果</span>
          <div class="approval-result-options">
            <span
              class="result-option"
              :class="{ selected: approvalStatus === 1 }"
              @click="approvalStatus = 1"
            >
              <van-icon name="passed" size="16" />
              通过
            </span>
            <span
              class="result-option danger"
              :class="{ selected: approvalStatus === 2 }"
              @click="approvalStatus = 2"
            >
              <van-icon name="close" size="16" />
              不通过
            </span>
          </div>
        </div>
        <van-field
          v-model="approvalComment"
          type="textarea"
          label="审批意见"
          placeholder="请输入审批意见（选填）"
          rows="3"
          autosize
          maxlength="100"
          show-word-limit="true"
        />
      </div>
    </van-dialog>

    <!-- 一键审批弹窗 -->
    <van-dialog
      v-model:show="showBatchDialog"
      title="一键审批"
      show-cancel-button
      :before-close="onBatchConfirm"
    >
      <div class="approval-dialog-content">
        <div class="batch-tip">将对全部 <strong>{{ pendingCount }}</strong> 条未审批记录执行批量审批</div>
        <div class="approval-result-row">
          <span class="approval-result-label">审批结果</span>
          <div class="approval-result-options">
            <span
              class="result-option"
              :class="{ selected: batchStatus === 1 }"
              @click="batchStatus = 1"
            >
              <van-icon name="passed" size="16" />
              全部通过
            </span>
            <span
              class="result-option danger"
              :class="{ selected: batchStatus === 2 }"
              @click="batchStatus = 2"
            >
              <van-icon name="close" size="16" />
              全部不通过
            </span>
          </div>
        </div>
        <van-field
          v-model="batchRemark"
          type="textarea"
          label="审批意见"
          placeholder="请输入审批意见（选填）"
          rows="3"
          autosize
          maxlength="100"
          show-word-limit="true"
        />
      </div>
    </van-dialog>
  </div>
</template>

<script>
import { useApproval } from './ApprovalView.js'
export default {
  name: 'Approval',
  setup() {
    return useApproval()
  }
}
</script>

<style src="./ApprovalView.css"></style>
