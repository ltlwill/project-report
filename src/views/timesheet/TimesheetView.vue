<template>
  <div class="timesheet-page">
    <!-- 可滚动区域 -->
    <div class="timesheet-scroll">
      <!-- 当前人信息 -->
      <div class="user-info-card">
        <div class="info-row">
          <span class="info-label">工号</span>
          <span class="info-value">{{ empId }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">姓名</span>
          <span class="info-value">{{ empName }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">工作时长</span>
          <!-- <span class="info-value">{{ workHours }}h/天</span> -->
          <span class="info-value">{{ workHours }}h</span>
          <span v-if="hasLeaveInfo" class="leave-info">({{ leaveType }} {{ currOriginLeaveDay }} 天)</span>
        </div>
      </div>

      <!-- 填报表单 -->
      <div class="form-card">
        <!-- 日期选择 -->
        <van-cell title="汇报日期" is-link :value="reportDate" @click="showDatePicker = true" />

        <!-- 岗位选择 -->
        <van-cell title="选择岗位" is-link :value="selectedPosition" @click="showPositionPicker = true" />

        <!-- 项目统计 -->
        <div class="project-summary">
          <div class="summary-item">
            <span class="summary-label">项目数</span>
            <span class="summary-value">{{ projectCount }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">总工时</span>
            <span class="summary-value">{{ totalHours.toFixed(1) }}h</span>
          </div>
        </div>

        <!-- 今日工作项目列表 -->
        <div class="project-list-section">
          <div class="section-header">
            <span class="section-title-text">工作项目</span>
            <van-button
              size="small"
              type="primary"
              plain
              icon="plus"
              :disabled="workHours <= 0"
              @click="showProjectSelector = true"
            >
              选择项目
            </van-button>
          </div>

          <van-empty v-if="projectList.length === 0" description="请选择工作项目" image="search" />
          <div v-else class="project-list">
            <div
              v-for="item in projectList"
              :key="item.projectId"
              class="project-card"
            >
              <div class="project-card-header">
                <div class="project-card-info">
                  <!-- <span class="project-no-text">{{ item.projectCode }}</span> -->
                  <span class="project-no-text">{{ item.plmCode }}</span>
                  <span class="project-name-text">{{ item.projectName }}</span>
                </div>
                <van-icon
                  name="cross"
                  class="remove-btn"
                  @click="onRemoveProject(item.projectId)"
                />
              </div>
              <div class="project-card-footer">
                <van-checkbox
                  :model-value="item.completed"
                  @update:model-value="(val) => onCompletedChange(item.projectId, val)"
                  shape="square"
                  icon-size="16px"
                >
                  阶段完成
                </van-checkbox>
                <div class="hours-group">
                  <span class="hours-label">工时(h)</span>
                  <van-stepper
                    :model-value="item.hours"
                    min="0"
                    max="8"
                    step="0.5"
                    input-width="50px"
                    @change="(val) => onHoursChange(item.projectId, val)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 提交按钮：固定在底部 -->
    <div class="submit-section">
      <van-button
        type="primary"
        block
        round
        :disabled="workHours <= 0"
        :loading="submitting"
        loading-text="提交中..."
        @click="onSubmit"
      >
        提交填报
      </van-button>
    </div>
    <van-popup v-model:show="showDatePicker" position="bottom" round teleport="body" :z-index="2000">
        <van-date-picker
          v-model="dateValue"
          title="选择日期"
          :min-date="minDate"
          :max-date="maxDate"
          @confirm="onDateConfirm"
          @cancel="showDatePicker = false"
        />
      </van-popup>
      <van-popup v-model:show="showPositionPicker" position="bottom" round teleport="body" :z-index="2000">
          <van-picker
            :columns="positionColumns"
            title="选择岗位"
            @confirm="onPositionConfirm"
            @cancel="showPositionPicker = false"
          />
      </van-popup>
    <!-- 项目选择器弹窗 -->
    <ProjectSelector v-model="showProjectSelector" />
  </div>
</template>

<script>
import { useTimesheet } from './TimesheetView.js'
import ProjectSelector from '@/components/ProjectSelector.vue'
export default {
  name: 'Timesheet',
  components: { ProjectSelector },
  setup() {
    return useTimesheet()
  }
}
</script>

<style src="./TimesheetView.css"></style>
