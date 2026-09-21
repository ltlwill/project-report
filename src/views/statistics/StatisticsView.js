/**
 * 统计模块逻辑
 * 工时数据汇总统计：当前登录人信息、时间区间筛选、概要汇总与项目明细
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { get } from '@/utils/request.js'
import { showTip } from '@/utils/tip'
import { useUserStore } from '@/store/modules/user.js'
import ClipboardJS from 'clipboard'
import { generateCertificateImages } from './certificate.js'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// 统计明细接口路径（后端路径调整时仅需修改此处）
const STATISTICS_URL = USE_MOCK ? '/statistics/detail-summary' : '/h5-open-api/erp/h5/get-detail-summary'

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * 快捷区间的起止日期
 * 本月：本月1号至今天；上月：上月1号至上月最后一天；
 * 近三个月/近六个月/近一年：前2/5/11个月的1号至今天
 */
function getQuickRange(key) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  if (key === 'lastMonth') return [new Date(y, m - 1, 1), new Date(y, m, 0)]
  if (key === 'last3Months') return [new Date(y, m - 2, 1), now]
  if (key === 'last6Months') return [new Date(y, m - 5, 1), now]
  if (key === 'last1Year') return [new Date(y, m - 11, 1), now]
  return [new Date(y, m, 1), now]
}

export function useStatistics() {
  const userStore = useUserStore()

  // 当前登录人信息
  const empId = computed(() => userStore.empId)
  const empName = computed(() => userStore.empName)

  // 时间区间（默认本月1号至今天）
  const today = new Date()
  const minDate = new Date(today.getFullYear() - 1, 0, 1)
  const maxDate = today
  const startDate = ref(formatDate(new Date(today.getFullYear(), today.getMonth(), 1)))
  const endDate = ref(formatDate(today))
  const showCalendar = ref(false)
  const defaultRange = computed(() => [parseDate(startDate.value), parseDate(endDate.value)])

  // 快捷时间区间
  const quickRanges = [
    { key: 'thisMonth', label: '本月' },
    { key: 'lastMonth', label: '上月' },
    { key: 'last3Months', label: '近三个月' },
    { key: 'last6Months', label: '近六个月' },
    { key: 'last1Year', label: '近一年' }
  ]
  const activeQuickRange = ref('thisMonth')

  // 统计数据
  const loading = ref(false)
  const refreshing = ref(false)
  const loadFailed = ref(false)
  const recordList = ref([])
  // 接口返回的姓名（登录缓存缺失时兜底展示）
  const apiEmpName = ref('')

  // 概要信息：优先使用接口返回的总工时，缺失时由明细汇总
  const totalHours = computed(() => {
    const fromApi = recordList.value[0]?.totalWorkHours
    if (fromApi != null && !isNaN(Number(fromApi))) return Number(fromApi)
    return recordList.value.reduce((sum, item) => sum + (Number(item.workHours) || 0), 0)
  })
  const projectCount = computed(() => recordList.value.length)

  /**
   * 工时占比（百分比数值，用于进度条与文案展示）
   * 兼容数字与字符串（如 "66.22%"）格式；缺失时按明细工时汇总计算
   */
  function getRatioPercent(item) {
    const raw = parseFloat(String(item.ratioPercent ?? '').replace('%', ''))
    const percent = isNaN(raw)
      ? (totalHours.value > 0 ? ((Number(item.workHours) || 0) / totalHours.value) * 100 : 0)
      : raw
    return Math.min(100, Math.max(0, percent))
  }

  async function loadStatistics() {
    loading.value = true
    try {
      const res = await get(STATISTICS_URL, {
        empId: empId.value,
        empNo: empId.value, // 后端接口必填参数：工号
        startDate: startDate.value,
        endDate: endDate.value
      })
      const data = res.data || res
      recordList.value = Array.isArray(data) ? data : (data.list || [])
      // 接口每行携带 empName，取值用于头部展示（登录缓存可能缺少姓名）
      apiEmpName.value = recordList.value[0]?.empName || ''
      loadFailed.value = false
    } catch (e) {
      console.error('加载工时统计数据失败:', e)
      recordList.value = []
      // 失败文案提示由 request.js 统一处理（网络错误/业务错误），此处仅切换错误态
      loadFailed.value = true
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }

  function onDateRangeConfirm(dates) {
    const [start, end] = dates
    startDate.value = formatDate(start)
    endDate.value = formatDate(end)
    activeQuickRange.value = '' // 手动选择区间时取消快捷选中态
    showCalendar.value = false
    loadStatistics()
  }

  // 快捷区间切换
  function onQuickRange(key) {
    const [start, end] = getQuickRange(key)
    startDate.value = formatDate(start)
    endDate.value = formatDate(end)
    activeQuickRange.value = key
    loadStatistics()
  }

  // 下拉刷新
  function onRefresh() {
    loadStatistics()
  }

  // ===== 导出菜单（复制清单 / 存为图片） =====
  const showExportMenu = ref(false)
  let clipboardInstance = null

  // 复制文本：项目名称清单（每行一个，方便粘贴到任意位置）
  function buildProjectNamesText() {
    return recordList.value.map(item => item.projectName).join('\n')
  }

  // 复制文本：项目明细表格（制表符分隔，粘贴到 Excel 自动分列）
  function buildProjectDetailText() {
    const rows = recordList.value.map(item =>
      [item.projectName, (Number(item.workHours) || 0).toFixed(1), `${getRatioPercent(item).toFixed(2)}%`].join('\t')
    )
    return ['项目名称\t工时(h)\t占比(%)', ...rows].join('\n')
  }

  /**
   * 初始化 ClipboardJS：绑定导出菜单中带 data-clip-type 的行，点击即复制
   * （弹窗设置了 :lazy-render="false"，挂载时菜单 DOM 已存在）
   */
  function initClipboard() {
    if (clipboardInstance) clipboardInstance.destroy()
    clipboardInstance = new ClipboardJS('.export-menu-item[data-clip-type]', {
      text: (trigger) =>
        trigger.dataset.clipType === 'names' ? buildProjectNamesText() : buildProjectDetailText()
    })
    clipboardInstance.on('success', () => {
      showExportMenu.value = false
      showTip('已复制')
    })
    clipboardInstance.on('error', () => {
      showTip('复制失败，请重试')
    })
  }

  // 菜单中非复制项的动作（复制项由 ClipboardJS 直接处理）
  function onExportMenuAction(action) {
    if (action === 'image') {
      showExportMenu.value = false
      onExportCert()
    }
  }

  // ===== 凭证图导出 =====
  const showCert = ref(false)
  const generatingCert = ref(false)
  const certImages = ref([])

  async function onExportCert() {
    showCert.value = true
    generatingCert.value = true
    certImages.value = []
    // 先渲染出弹窗与加载态，再执行绘图（canvas 绘制为同步操作，会阻塞渲染）
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 150))
    try {
      certImages.value = generateCertificateImages({
        empName: apiEmpName.value || empName.value || '用户',
        empId: empId.value,
        startDate: startDate.value,
        endDate: endDate.value,
        totalHours: totalHours.value,
        projectCount: projectCount.value,
        items: recordList.value.map(item => ({
          projectName: item.projectName,
          workHours: Number(item.workHours) || 0,
          percent: getRatioPercent(item)
        }))
      })
    } catch (e) {
      console.error('生成统计凭证失败:', e)
      showCert.value = false
      showTip('图片生成失败，请重试')
    } finally {
      generatingCert.value = false
    }
  }

  // keep-alive 缓存页面：仅首次挂载时加载，切换回页面不重新请求
  onMounted(() => {
    loadStatistics()
    initClipboard()
  })

  onUnmounted(() => {
    if (clipboardInstance) clipboardInstance.destroy()
  })

  return {
    empId, empName, apiEmpName,
    startDate, endDate, minDate, maxDate, showCalendar, defaultRange,
    quickRanges, activeQuickRange, onQuickRange,
    loading, refreshing, loadFailed, recordList, totalHours, projectCount,
    getRatioPercent, onDateRangeConfirm, onRefresh, loadStatistics,
    showCert, generatingCert, certImages, onExportCert,
    showExportMenu, onExportMenuAction
  }
}
