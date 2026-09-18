<template>
  <div class="detail-page">
    <van-loading v-if="loading" class="detail-loading" />
    <template v-else>
      <!-- 基本信息 -->
      <div class="detail-info-card">
        <div class="detail-row">
          <span class="detail-label">填&nbsp;&nbsp;报&nbsp;&nbsp;人</span>
          <span class="detail-value">{{ detail.empName }}({{ detail.empId }})</span>
        </div>
        <!-- <div class="detail-row">
          <span class="detail-label">工号</span>
          <span class="detail-value">{{ detail.empId }}</span>
        </div> -->
        <!-- <div class="detail-row">
          <span class="detail-label">岗&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;位</span>  
          <span class="detail-value">{{ detail.positionName }}</span>
        </div> -->
        <div class="detail-row">
          <span class="detail-label">汇报日期</span>
          <span class="detail-value">{{ detail.reportDate }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">填报时间</span>
          <span class="detail-value">{{ formatToDateTime(detail.createTime) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">总&nbsp;&nbsp;工&nbsp;&nbsp;时</span>
          <span class="detail-value hours-value">{{ detail.totalWorkHours }}h</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">审批状态</span>
          <van-tag :type="getStatusType(detail.approvalStatus)" plain>
            {{ getStatusText(detail.approvalStatus) }}
          </van-tag>
        </div>
        <div v-if="detail.approvalEmpName" class="detail-row">
          <span class="detail-label">审&nbsp;&nbsp;批&nbsp;&nbsp;人</span>
          <span class="detail-value remark-text">{{ detail.approvalEmpName }}({{ detail.approvalEmpNo }})</span>
        </div>
        <div v-if="detail.approvalEmpName && detail.approvalTime" class="detail-row">
          <span class="detail-label">审批时间</span>
          <span class="detail-value remark-text">{{ formatToDateTime(detail.approvalTime) }}</span>
        </div>
        <div v-if="detail.approvalEmpName && detail.approvalComment" class="detail-row">
          <span class="detail-label">审批意见</span>
          <span class="detail-value remark-text">{{ detail.approvalComment }}</span>
        </div>
      </div>

      <!-- 项目明细 -->
      <div class="detail-section">
        <div class="detail-section-title">项目明细（{{ projectDetails.length }} 个）</div>
        <div class="detail-project-list">
          <div
            v-for="(item, index) in projectDetails"
            :key="item.projectId"
            class="detail-project-item"
          >
            <div class="project-index">{{ index + 1 }}</div>
            <div class="project-detail-info">
              <!-- <div class="project-detail-no">{{ item.plmCode }}</div> -->
              <div class="project-detail-name">{{ item.projectName }}
                <van-tag type="success" class="stage-complete-tag" v-if="item.stageComplete">阶段完成</van-tag>
              </div>
            </div>
            <div class="project-detail-hours">{{ item.workHours }}h</div>
          </div>
        </div>
      </div>
    </template>

    <!-- 底部悬浮操作栏：返回（左）+ 审批（右，仅未审批时显示） -->
    <div class="detail-action-bar">
      <div class="detail-back-btn" @click="goBack">
        <van-icon name="arrow-left" size="18" />
        <span>返回</span>
      </div>
      <div v-if="isPending" class="detail-approve-btn" @click="openApproval">
        <van-icon name="passed" size="18" />
        <span>审批</span>
      </div>
      <!-- <div v-if="isUnapproved" class="detail-cancel-btn" @click="cancelReport">
        <van-icon name="revoke" size="18"/>
        <span>取消</span>
      </div> -->
      <div v-if="isSubmitList" class="detail-delete-btn" @click="deleteReport">
        <van-icon name="delete" size="18"/>
        <span>删除</span>
      </div>
    </div>

    <!-- 审批弹窗 -->
    <van-dialog
      v-model:show="showApprovalDialog"
      title="审批"
      show-cancel-button
      teleport="body"
      :z-index="2000"
      :before-close="onApprovalConfirm"
    >
      <div class="detail-approval-content">
        <div class="approval-result-row">
          <span class="approval-result-label">审批结果</span>
          <div class="approval-result-options">
            <span
              class="result-option"
              :class="{ selected: approvalStatus === 1 }"
              @click="approvalStatus = 1"
            >
              <van-icon name="passed" size="16" />通过
            </span>
            <span
              class="result-option danger"
              :class="{ selected: approvalStatus === 2 }"
              @click="approvalStatus = 2"
            >
              <van-icon name="close" size="16" />不通过
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
        />
      </div>
    </van-dialog>
  </div>
</template>

<script>
import { useRecordDetail } from './RecordDetailView.js'
export default {
  setup() {
    return useRecordDetail()
  }
}
</script>

<style src="./RecordDetailView.css"></style>
