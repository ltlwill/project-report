import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { showToast } from 'vant'
import { get, post } from '@/utils/request.js'
import { showTip } from '@/utils/tip'
import { formatToDateTime } from '@/utils/dateUtil'
import { approvalUpdate } from '@/shared/approvalUpdate.js'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export function useApproval() {
  const router = useRouter()

  // 审批页滚动容器是 .approval-scroll（页面自己的）
  // const scrollRef = ref(null)
  // let savedScrollTop = 0

  // onBeforeRouteLeave(() => {
  //   if (scrollRef.value) savedScrollTop = scrollRef.value.scrollTop
  // })

  // onActivated(() => {
  //   if (scrollRef.value) scrollRef.value.scrollTop = savedScrollTop
  // })

  const scrollRef = ref(null)
  let savedScrollTop = 0

  onBeforeRouteLeave(() => {
    // .app-content 是 scrollRef 的父元素
    const appContent = scrollRef.value?.closest('.app-content')
    if (appContent) savedScrollTop = appContent.scrollTop
  })

  onActivated(() => {
    const appContent = scrollRef.value?.closest('.app-content')
    if (appContent) {
      appContent.scrollTop = savedScrollTop
    }
  })

  const keyword = ref('')
  const loading = ref(false)
  const refreshing = ref(false)
  const allRecords = ref([])   // 原始全量数据
  const statusFilter = ref(0) // 默认「未审批」

  // 状态筛选Tab配置
  const statusTabs = [
    { label: '全部', value: null },
    { label: '未审批', value: 0 },
    { label: '已通过', value: 1 },
    { label: '不通过', value: 2 },
    { label: '已取消', value: 3 },
  ]

  // 过滤后的列表
  const records = computed(() => {
    if (statusFilter.value === -1 || statusFilter.value === null) return allRecords.value
    return allRecords.value.filter(r => r.approvalStatus === statusFilter.value)
  })

  // 审批弹窗
  const showDialog = ref(false)
  const currentRecord = ref(null)
  const approvalStatus = ref(1) // 1=通过, 2=不通过
  const approvalComment = ref('')

  function getStatusType(status) {
    const map = { 0: 'warning', 1: 'success', 2: 'danger' }
    return map[status] ?? 'default'
  }

  function getStatusText(status) {
    const map = { 0: '未审批', 1: '已通过', 2: '不通过', 3: '已取消' }
    return map[status] ?? '未知'
  }

  // 当前筛选下的未审批记录数量（用于一键审批按钮提示）
  const pendingCount = computed(() => allRecords.value.filter(r => r.approvalStatus === 0).length)

  // 一键审批弹窗
  const showBatchDialog = ref(false)
  const batchStatus = ref(1)   // 1=通过, 2=不通过
  const batchRemark = ref('')

  function openBatchApproval() {
    batchStatus.value = 1
    batchRemark.value = ''
    showBatchDialog.value = true
  }

  async function onBatchConfirm(action) {
    if (action === 'cancel') return true
    const pendingList = allRecords.value.filter(r => r.approvalStatus === 0)
    if (pendingList.length === 0) {
      showTip('暂无待审批记录')
      return true
    }
    const ids = pendingList.map(r => r.id)
    doSubmitApprovalData(ids, batchStatus.value, batchRemark.value, true)
      
  }

  async function loadRecords(approvalStatus) {
    loading.value = true
    try {
      const url = USE_MOCK ? '/timesheet/approval-list' : '/h5-open-api/erp/h5/approval-list'
      const params = { keyword: keyword.value, pageSize: 100 }
      if(approvalStatus !== null && approvalStatus !== undefined){
        params.approvalStatus = approvalStatus
      }
      const res = await get(url, params)
      const data = res.data || res
      allRecords.value = Array.isArray(data) ? data : (data.list || [])
    } catch (e) {
      console.error('加载审批列表失败:', e)
      allRecords.value = []
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }

  function onSearch() {
    loadRecords(statusFilter.value)
  }

  function onRefresh() {
    loadRecords(statusFilter.value)
  }

  function goDetail(id) {
    router.push({path: `/record-detail/${id}`, query: { from: 'approval-list' }})
  }

  // 打开审批弹窗（不预设结果，由用户在弹窗中选择）
  function openApproval(item) {
    currentRecord.value = item
    approvalStatus.value = 1  // 默认选中「通过」
    approvalComment.value = ''
    showDialog.value = true
  }

  async function onDialogConfirm(action) {
    if (action === 'cancel') {
      return true
    }
    doSubmitApprovalData([currentRecord.value.id], approvalStatus.value, approvalComment.value)
  }

  async function doSubmitApprovalData(ids, approvalStatus, approvalComment, isBatch = false){
    try {
      const url = `/h5-open-api/erp/h5/approval?approvalStatus=${approvalStatus}&approvalComment=${approvalComment}`
      const res = await post(url, ids)
      if(res && res.code === 0 && res.data){
        showTip('审批成功')
        if (isBatch) {
          allRecords.value.forEach(r => {
            if(ids.includes(r.id)){
              r.approvalStatus = approvalStatus
            }
          })
          showBatchDialog.value = false
          return true
        }else{
          // 更新本地状态（不移除，改为显示最新状态）
          const target = allRecords.value.find(r => r.id === currentRecord.value.id)
          if (target) target.approvalStatus = approvalStatus
          showDialog.value = false
          return true
        }
      }else{
        showTip('审批失败')
      }
    } catch (error) {
      // showToast(error.message || '审批失败')
      showTip(error.message || '审批失败')
      return false
    }
  }

  function handleStatusChange(status){
    statusFilter.value = status
    loadRecords(status)
  }

  onMounted(() => {
    loadRecords()
  })

  // 监听详情页审批状态变更，同步更新列表中对应记录
  watch(approvalUpdate, (val) => {
    if (val.id && val.timestamp) {
      const target = allRecords.value.find(r => r.id === val.id)
      if (target) target.approvalStatus = val.status
    }
  })

  // keep-alive 激活时不重新请求，保持数据和滚动位置

  return {
    keyword,
    loading,
    refreshing,
    records,
    statusFilter,
    statusTabs,
    pendingCount,
    showDialog,
    approvalStatus,
    approvalComment,
    showBatchDialog,
    batchStatus,
    batchRemark,
    getStatusType,
    getStatusText,
    onSearch,
    onRefresh,
    goDetail,
    openApproval,
    onDialogConfirm,
    openBatchApproval,
    onBatchConfirm,
    scrollRef,
    handleStatusChange,
    formatToDateTime
  }
}
