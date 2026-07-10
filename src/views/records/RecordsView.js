import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { get } from '@/utils/request.js'
import { formatToDateTime } from '@/utils/dateUtil.js'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export function useRecords() {
  const router = useRouter()

  // 滚动位置保存：记录页滚动容器是外层 .app-content
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
  const statusFilter = ref(null) // -1=全部, 0=未审批, 1=通过, 2=不通过

  // 状态筛选Tab配置
  const statusTabs = [
    { label: '全部', value: null },
    { label: '未审批', value: 0 },
    { label: '通过', value: 1 },
    { label: '不通过', value: 2 }
  ]

  // 过滤后的列表
  const records = computed(() => {
    if (statusFilter.value === -1 || statusFilter.value === null) return allRecords.value
    return allRecords.value.filter(r => r.approvalStatus === statusFilter.value)
  })

  function getStatusType(status) {
    const map = { 0: 'warning', 1: 'success', 2: 'danger' }
    return map[status] ?? 'default'
  }

  function getStatusText(status) {
    const map = { 0: '未审批', 1: '通过', 2: '不通过' }
    return map[status] ?? '未知'
  }

  async function loadRecords(approvalStatus) {
    loading.value = true
    try {
      const url = USE_MOCK ? '/timesheet/records' : '/h5-open-api/erp/h5/submit-records'
      const params = { keyword: keyword.value, pageSize: 100}
      if(approvalStatus !== null && approvalStatus !== undefined){
        params.approvalStatus = approvalStatus
      }
      const res = await get(url, params)
      const data = res.data || res
      allRecords.value = Array.isArray(data) ? data : (data.list || [])
    } catch (e) {
      console.error('加载填报记录失败:', e)
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
    router.push({path: `/record-detail/${id}`, query: { from: 'submit-list' }})
  }

  function handleStatusChange(status){
    statusFilter.value = status
    loadRecords(status)
  }

  onMounted(() => {
    loadRecords()
  })

  // keep-alive 激活时不重新请求（已由 onMounted 首次加载）
  // 如需强制刷新可使用下拉刷新

  return {
    keyword,
    loading,
    refreshing,
    records,
    statusFilter,
    statusTabs,
    getStatusType,
    getStatusText,
    onSearch,
    onRefresh,
    goDetail,
    scrollRef,
    formatToDateTime,
    handleStatusChange
  }
}
