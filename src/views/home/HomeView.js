import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user.js'
import { get } from '@/utils/request.js'
import * as echarts from 'echarts'

export function useHome() {
  const router = useRouter()
  const userStore = useUserStore()

  const empId = ref(userStore.empId)
  const empName = ref(userStore.empName)
  const chartRef = ref(null)
  const pieChartRef = ref(null)
  const lineChartRef = ref(null)
  let chartInstance = null
  let pieChartInstance = null
  let lineChartInstance = null

  const currentDate = ref('')
  const stats = reactive({
    projectCount: 33,
    weekHours: 73.5,
    monthHours: 312.5
  })

  const statisticsData = ref({
    summaryData: {totalCount: 0, weekHours: 0, monthHours: 0},
    weekData: {},
    last6MonthData: [],
    productTypeSummaryData: []
  })

  const recentList = ref([])

  const shortcuts = [
    { name: '填报', icon: 'edit', path: '/timesheet', color: '#1989fa' },
    { name: '记录', icon: 'notes-o', path: '/records', color: '#07c160' },
    { name: '审批', icon: 'shield-o', path: '/approval', color: '#ff976a' },
    { name: '我的', icon: 'user-o', path: '/mine', color: '#969799' }
  ]

  // 格式化当前日期
  function formatDate() {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return `${y}-${m}-${d} 星期${weekdays[now.getDay()]}`
  }

  // 加载统计数据
  async function loadStats() {
    try {
      const res = await get('/home/stats')
      const data = res.data || res
      stats.projectCount = data.projectCount || 0
      stats.weekHours = data.weekHours || 0
      stats.monthHours = data.monthHours || 0
    } catch (e) {
      console.error('加载统计数据失败:', e)
    }
  }

  // 加载最近填报
  async function loadRecent() {
    try {
      const res = await get('/timesheet/recent', { limit: 5 })
      recentList.value = res.data || res || []
    } catch (e) {
      console.error('加载最近填报失败:', e)
      recentList.value = []
    }
  }

  // 初始化图表
  function initChart() {
    if (!chartRef.value) return
    chartInstance = echarts.init(chartRef.value)
    const days = ['周一', '周二', '周三', '周四', '周五']
    // const hours = [8, 7.5, 8, 6, 8.5]
    let hours = []
    if(statisticsData.value?.weekData){
      const weekData = statisticsData.value?.weekData || {}
      hours = [weekData.week1, weekData.week2, weekData.week3, weekData.week4, weekData.week5]
    }

    chartInstance.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: days,
        axisLine: { lineStyle: { color: '#ddd' } },
        axisLabel: { color: '#666', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 10,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { color: '#999', fontSize: 11 }
      },
      series: [{
        type: 'bar',
        data: hours,
        barWidth: '40%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#1989fa' },
            { offset: 1, color: '#a0cfff' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          fontSize: 11,
          color: '#1989fa',
          formatter: '{c}h'
        }
      }],
      grid: { left: 30, right: 10, top: 24, bottom: 30 }
    })
  }

  // 初始化饼图（项目工时分布）
  function initPieChart() {
    if (!pieChartRef.value) return
    const data = (statisticsData.value?.productTypeSummaryData || []).map(item => ({
      value: item.totalHours,
      name: item.productType
    }))
    pieChartInstance = echarts.init(pieChartRef.value)
    pieChartInstance.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}h ({d}%)' },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { fontSize: 11, color: '#666' }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          fontSize: 11,
          color: '#333',
          formatter: '{b}\n{c}h'
        },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 'bold' }
        },
        data: data
        // data: [
        //   { value: 32, name: '器件-9XX', itemStyle: { color: '#1989fa' } },
        //   { value: 24, name: '器件-N9XX', itemStyle: { color: '#07c160' } },
        //   { value: 18, name: '器件-科研', itemStyle: { color: '#ff976a' } },
        //   { value: 12, name: '器件-海外', itemStyle: { color: '#ee0a24' } },
        //   { value: 8, name: '其他项目', itemStyle: { color: '#969799' } }
        // ]
      }]
    })
  }

  function formatMonthName(month){
    const arr = month.split('-')
    return `${parseInt(arr[1])}月`
  }

  // 初始化折线图（月度工时趋势）
  function initLineChart() {
    if (!lineChartRef.value) return
    const data = (statisticsData.value?.last6MonthData || []).map(item => {
      return {
        value: parseFloat(item.totalHours || 0),
        name: item.month,
        nameFmt: formatMonthName(item.month)
      }
    })
    const xAxisData = data.map(item => item.nameFmt)
    const seriesData = data.map(item => item.value)
    lineChartInstance = echarts.init(lineChartRef.value)
    lineChartInstance.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: xAxisData,
        // data: ['2月', '3月', '4月', '5月', '6月', '7月'],
        axisLine: { lineStyle: { color: '#ddd' } },
        axisLabel: { color: '#666', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        name: '工时(h)',
        nameTextStyle: { color: '#999', fontSize: 11 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        axisLabel: { color: '#999', fontSize: 11 }
      },
      series: [{
        type: 'line',
        data: seriesData,
        // data: [156, 168, 172, 160, 176, 148],
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#1989fa', width: 3 },
        itemStyle: { color: '#1989fa', borderWidth: 2, borderColor: '#fff' },
        label: {
          show: true,
          position: 'top',
          fontSize: 11,
          color: '#1989fa',
          formatter: '{c}h'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(25, 137, 250, 0.3)' },
            { offset: 1, color: 'rgba(25, 137, 250, 0.02)' }
          ])
        }
      }],
      grid: { left: 40, right: 10, top: 24, bottom: 30 }
    })
  }

  function goTo(path) {
    router.push(path)
  }

  function getStatusType(status) {
    const map = { 0: 'warning', 1: 'success', 2: 'danger' }
    return map[status] || 'default'
  }

  function getStatusText(status) {
    const map = { 0: '未审批', 1: '通过', 2: '不通过' }
    return map[status] || '未知'
  }

  async function initCharts() {
    initChart()
    initPieChart()
    initLineChart()
  }

  async function loadStatisticsData() { 
    try {
      const empId = userStore.empId || ''
      // const empId = ''
      const url = `/h5-open-api/erp/h5/statistics?empId=${empId}`
      const res = await get(url)
      const data = res.data || {}
      statisticsData.value = data
      await nextTick()
      initCharts()
    } catch (e) {
      console.error('统计数据失败:', e)
      detail.value = {}
    } finally {
    }
  }

  onMounted(async () => {
    currentDate.value = formatDate()
    await nextTick()
    initCharts()
    loadStatisticsData()
  })

  onBeforeUnmount(() => {
    if (chartInstance) { chartInstance.dispose(); chartInstance = null }
    if (pieChartInstance) { pieChartInstance.dispose(); pieChartInstance = null }
    if (lineChartInstance) { lineChartInstance.dispose(); lineChartInstance = null }
  })

  return {
    empName,
    currentDate,
    stats,
    chartRef,
    pieChartRef,
    lineChartRef,
    shortcuts,
    recentList,
    goTo,
    getStatusType,
    getStatusText,
    statisticsData
  }
}
