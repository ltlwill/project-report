import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { get, post } from '@/utils/request.js'
import { showTip } from '@/utils/tip'
import { formatToDateTime } from '@/utils/dateUtil.js'
import { approvalUpdate } from '@/shared/approvalUpdate.js'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false' 

export function useRecordDetail() {
  const route = useRoute()
  const router = useRouter()
  const fromPage = route.query.from

  function goBack() {
    router.back()
  }

  const loading = ref(true)
  const detail = ref({})
  const projectDetails = ref([])

  // 审批弹窗相关
  const showApprovalDialog = ref(false)
  const approvalStatus = ref(1)   // 1=通过, 2=不通过
  const approvalComment = ref('')

  // 当前记录是否未审批
  const isPending = computed(() => detail.value.approvalStatus === 0 && fromPage === 'approval-list')

  function openApproval() {
    approvalStatus.value = 1
    approvalComment.value = ''
    showApprovalDialog.value = true
  }

  async function onApprovalConfirm(action) {
    if (action === 'cancel') return true
    try {
      const url = `/h5-open-api/erp/h5/approval?approvalStatus=${approvalStatus.value}&approvalComment=${approvalComment.value}`
      const res = await post(url, [detail.value.id])
      if(res && res.code === 0 && res.data){
        showTip('审批成功')
        // 更新本地状态
        const data = res.data && res.data.length ? res.data[0] : {}
        detail.value = {
          ...detail.value,
          ...data
        }
        // 通知审批列表页更新对应记录的状态
        approvalUpdate.value = {
          id: detail.value.id,
          status: approvalStatus.value,
          timestamp: Date.now()
        }
        return true
      }else{
        showTip('审批失败')
        return false
      }
    } catch (error) {
      // showToast(error.message || '审批失败')
      showTip(error.message || '审批失败')
      return false
    }
  }

  function getStatusType(status) {
    const map = { 0: 'warning', 1: 'success', 2: 'danger' }
    return map[status] || 'default'
  }

  function getStatusText(status) {
    const map = { 0: '未审批', 1: '通过', 2: '不通过' }
    return map[status] || '未知'
  }

  async function loadDetail() {
    loading.value = true
    const id = route.params.id
    try {
      const url = USE_MOCK ? `/timesheet/detail/${id}` : `/h5-open-api/erp/h5/project/detail/${id}`
      const res = await get(url)
      const data = res.data || res
      detail.value = data
      projectDetails.value = data.projectDetails || []
    } catch (e) {
      console.error('加载填报详情失败:', e)
      showTip('加载填报详情失败，请稍后重试')
      detail.value = {}
      projectDetails.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    loadDetail()
  })

  return {
    loading,
    detail,
    projectDetails,
    isPending,
    showApprovalDialog,
    approvalStatus,
    approvalComment,
    getStatusType,
    getStatusText,
    goBack,
    openApproval,
    onApprovalConfirm,
    formatToDateTime
  }
}
