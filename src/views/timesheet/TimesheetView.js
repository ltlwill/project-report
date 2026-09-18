import { ref, computed, onMounted, onActivated, nextTick } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user.js'
import { useTimesheetStore } from '@/store/modules/timesheet.js'
import { get, post } from '@/utils/request.js'
import { showTip } from '@/utils/tip'
import dayjs from 'dayjs'

export function useTimesheet() {
  const router = useRouter()
  const userStore = useUserStore()
  const timesheetStore = useTimesheetStore()

  // 当前人信息
  const empId = computed(() => userStore.empId)
  const empName = computed(() => userStore.empName)
  // const workHours = computed(() => userStore.userInfo?.workHours || 8)
  const workHours = ref(8)
  const hasLeaveInfo = ref(false)
  const currOriginLeaveDay = ref(0)
  const currValidWorkHour = ref(0)
  const leaveDesc = ref('')
  const leaveDetails = ref([])
  const unSubmitDates = ref([])
  const unSubmitDatesMessage = ref('')
  const currentEmpPositionInfo = ref({})

  // 日期相关
  const now = new Date()
  const showDatePicker = ref(false)
  const reportDate = ref(formatDateStr(now))
  const dateValue = ref([
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ])
  // const minDate = new Date(now.getFullYear() - 1, 0, 1)
  // const maxDate = new Date(now.getFullYear() + 1, 11, 31)
  const minDate = computed(() => {
    const entryDate = currentEmpPositionInfo.value?.entryDate
    const rdTransferDate = currentEmpPositionInfo.value?.rdTransferDate
    const startDate = rdTransferDate ? rdTransferDate : entryDate
    return dayjs(startDate).toDate()
  })
  const maxDate = now


  // 岗位相关
  const showPositionPicker = ref(false)
  // 从 localStorage 读取上次选择的岗位
  const cachedPosition = JSON.parse(localStorage.getItem('last_position') || 'null')
  const selectedPosition = ref(cachedPosition?.text || '')
  const selectedPositionValue = ref(cachedPosition?.value || '')
  const allHolidayScheduleData = ref([])
  const attendanceWorkhoursData = ref({})
  const holidayInfo = ref({isHoliday: false, holidayDesc: '', isWorkDay: true, isWeekendDay: false})

  // 项目列表
  const showProjectSelector = ref(false)
  const projectList = computed(() => timesheetStore.projectList)
  const projectCount = computed(() => timesheetStore.projectCount)
  const totalHours = computed(() => timesheetStore.totalHours)
  const isDL = computed(() => currentEmpPositionInfo.value?.empType === 'DL')

  // 提交状态
  const submitting = ref(false)

  function formatDateStr(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  async function onDateConfirm({ selectedValues }) {
    reportDate.value = selectedValues.join('-')
    showDatePicker.value = false
    await loadEmpAttendanceData(reportDate.value)
    loadCurrentDateLeaveInfo(reportDate.value)
    loadLoaderReportData(reportDate.value)
    calcHolidayInfoByDate(reportDate.value)
  }

  async function loadCurrentDateLeaveInfo(reportDate) {
    try {
      const url = `/h5-open-api/erp/h5/get-leave-info?empId=${empId.value}&date=${reportDate}`
      const res = await get(url)
      if(isDL.value){
        const atteWorkHours = attendanceWorkhoursData.value[reportDate] || 0
        workHours.value = atteWorkHours
      }else{
        if(res.data && res.data.length){
          hasLeaveInfo.value = true
          const totalLeaveHours =(res.data || []).reduce((acc, cur) => acc + cur.currLeaveHour, 0)
          const totalValidWorkHour = 8 - totalLeaveHours
          workHours.value = holidayInfo.value?.isHoliday ? 0 : totalValidWorkHour
          currValidWorkHour.value = totalValidWorkHour
          leaveDesc.value = (res.data || []).map((item) => item.type + " " + item.currLeaveHour + "h").join(';')
          leaveDetails.value = (res.data || []).map((item) => ({ 
            leaveType: item.type,
            leaveHour: item.currLeaveHour,
            leaveDate: item.date
          }))
        }else{
          hasLeaveInfo.value = false
          workHours.value = holidayInfo.value?.isHoliday ? 0 : 8
          currValidWorkHour.value = 0
          leaveDesc.value = ''
          leaveDetails.value = []
        }
      }
    } catch (e) {
      console.error('加载请假信息失败失败:', e)
    } finally {
    }
  } 

  async function loadLoaderReportData(reportDate) {
    try {
      const url = `/h5-open-api/erp/h5/get-leader-report?type=0&empId=${empId.value}&date=${reportDate}`
      const res = await get(url)
      if(res.data && res.data.length){
        timesheetStore.projectList = (res.data || []).map((item) => ({
          projectId: item.projectCode,
          projectCode: item.projectCode,
          projectName: item.projectName,
          plmCode: item.plmCode,
          specModel: item.specModel,
          shellName: item.shellName,
          productType: item.productType,
          hours: item.workHours,
          completed: item.stageComplete,
          leaderReport: true
        }))
        showTip('已自动为你拉取上级当日报告')
      }else{
        timesheetStore.projectList = (timesheetStore.projectList || []).filter((item) => !item.leaderReport)
      }
    } catch (e) {
      console.error('加载领导报告信息失败:', e)
    } finally {
    }
  } 

  async function loadUnSubmitReportDates() {
    try {
      const url = `/h5-open-api/erp/h5/get-unsubmit-dates?type=0&empId=${empId.value}`
      const res = await get(url)
      if(res.data){
        unSubmitDates.value = res.data || []
        unSubmitDatesMessage.value = `你最近有 ${unSubmitDates.value.length} 天工时未填报，分别是 ${unSubmitDates.value.join(',')}，如已填报请忽略！`
      }else{
        unSubmitDates.value = []
        unSubmitDatesMessage.value = ''
      }
    } catch (e) {
      console.error('加载未填写报告日期数据失败:', e)
    } finally {
    }
  } 

  async function loadHolidaysScheduleData() {
    try {
      const url = `/h5-open-api/erp/h5/get-work-date-schedule?year=${now.getFullYear()}&empId=${empId.value}&type=0`
      const res = await get(url)
      allHolidayScheduleData.value = res?.data || []
      calcHolidayInfoByDate(reportDate.value)
    } catch (e) {
      console.error('加载未填写报告日期数据失败:', e)
    } finally {
    }
  } 

  async function loadEmpEntryAndLeaveInfo() {
    try {
      const url = `/h5-open-api/erp/h5/get-entry-leave-info?&empId=${empId.value}`
      const res = await get(url)
      currentEmpPositionInfo.value = res?.data || {}
    } catch (e) {
      console.error('加载员工入职离职信息数据失败:', e)
    } finally {
    }
  } 

  async function loadEmpAttendanceData(dateString) {
    try {
      const url = `/h5-open-api/erp/h5/get-attendance-work-hours-map?empNo=${empId.value}&empType=DL&dates=${dateString}`
      const res = await get(url)
      attendanceWorkhoursData.value = res?.data || {}
    } catch (e) {
      console.error('加载考勤工时数据失败:', e)
    } finally {
    }
  } 

  function isContainsInHolidayScheduleDays(workDate) {
    return allHolidayScheduleData.value.some((item) => item.scheduleDate === workDate)
  }

  async function calcHolidayInfoByDate(dateString) {
    await nextTick()
    const now = dayjs()
    const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekEndDayIndex = [0, 6]
    let current = dayjs(dateString)
    const dateStr = current.format('YYYY-MM-DD')
    const dayIndex = current.day()
    const dayName = weekMap[dayIndex]
    const isWeekendDay = weekEndDayIndex.includes(dayIndex) // 周末
    const isWorkDay = !weekEndDayIndex.includes(dayIndex) // 工作日
    const atteWorkHours = attendanceWorkhoursData.value[dateStr] || 0
    let isHoliday = false
    let holidayDesc = ''
    if (current.isAfter(now)) {
      isHoliday = true
      holidayDesc = '未入职'
      isHoliday = true
    } else if ((isWorkDay && isContainsInHolidayScheduleDays(dateStr) && !isDL.value) || (isWorkDay && isContainsInHolidayScheduleDays(dateStr) && isDL.value && atteWorkHours <= 0)) {
      isHoliday = true
      holidayDesc = '节假日'
    } else if ((isWeekendDay && isContainsInHolidayScheduleDays(dateStr) && !isDL.value) || (isWeekendDay && isContainsInHolidayScheduleDays(dateStr) && isDL.value && atteWorkHours > 0)) {
      isHoliday = false
      holidayDesc = isDL.value ? '班' : '补班'
    } else if (isWeekendDay && isDL.value && atteWorkHours > 0) {
      isHoliday = false
      holidayDesc = '班'
    } else {
      isHoliday = isWeekendDay
      holidayDesc = isDL.value ? '休' : '周末'
    }
    holidayInfo.value = { isHoliday, holidayDesc, isWorkDay, isWeekendDay }
    if(isHoliday){
      workHours.value = 0
    }
  }

  function onPositionConfirm({ selectedOptions }) {
    selectedPosition.value = selectedOptions[0]?.text || ''
    selectedPositionValue.value = selectedOptions[0]?.value || ''
    // 缓存到 localStorage
    localStorage.setItem('last_position', JSON.stringify({
      text: selectedPosition.value,
      value: selectedPositionValue.value
    }))
    showPositionPicker.value = false
  }

  function onRemoveProject(projectId) {
    timesheetStore.removeProject(projectId)
  }

  function onHoursChange(projectId, val) {
    timesheetStore.setProjectHours(projectId, val)
  }

  function onCompletedChange(projectId, val) {
    timesheetStore.setProjectCompleted(projectId, val)
  }

    // 格式化当前日期
  function formatDateWithWeekDay(date) {
    if (!date) {
      return ''
    }
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return `${y}-${m}-${d} 星期${weekdays[date.getDay()]}`
  }

  function formatDate(date) {
    if (!date) {
      return ''
    }
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  async function onSubmit() {
    // 校验
    if (!reportDate.value) {
      // showToast('请选择汇报日期')
      showTip('请选择汇报日期')
      return
    }
    // if (!selectedPosition.value) {
    //   // showToast('请选择岗位')
    //   showTip('请选择岗位')
    //   return
    // }
    if (projectList.value.length === 0) {
      // showToast('请至少选择一个项目')
      showTip('请至少选择一个项目')
      return
    }
    if (totalHours.value <= 0) {
      // showToast('请填写项目工时')
      showTip('请填写项目工时')
      return
    }
    if(totalHours.value > workHours.value){
      showTip(`总工时不能超过${workHours.value}小时`)  
      return
    }
    if(totalHours.value !== workHours.value){
      showTip(`总工时不等于${workHours.value}小时`)  
      return
    }
    if(projectList.value.some(p => p.hours <= 0)){
      showTip(`项目工时必须大于0`)
      return
    }
    const now = new Date()
    const today = formatDate(now)
    const yesterday = formatDate(new Date(now.setDate(now.getDate() - 1)))
    if(reportDate.value === today && now.getHours() < 18){
      showTip('18点前不能提交当天的填报')
      return
    }else if(reportDate.value === yesterday && now.getHours() >= 10){
      // showTip('10点后不能提交昨天的填报')
      // return
    }else if(reportDate.value > today){
      showTip('不能提交将来的填报')
      return
    }else if(reportDate.value < yesterday){
      // showTip('不能提交昨天之前的填报')
      // return
    }
    let isSupplement = false
    if((reportDate.value === yesterday && now.getHours() >= 12) || reportDate.value < yesterday){
      isSupplement = true
    }
    const arr = reportDate.value.split('-')
    const formattedDate = formatDateWithWeekDay(new Date(arr[0], arr[1] - 1, arr[2]))
    let message = `确认提交 <span style="font-weight: bold;color: #ee0a24;">${formattedDate}</span> 的工时填报？\n` 
    message += `共 <span style="font-weight: bold;color: #ee0a24;">${projectCount.value}</span> 个项目，`
    message += `总工时 <span style="font-weight: bold;color: #ee0a24;">${totalHours.value.toFixed(1)}h</span>`
    try {
      await showConfirmDialog({
        title: '确认提交',
        allowHtml: true,
        message: message
      })
    } catch {
      return
    }

    submitting.value = true
    try {
      const dataType = 0
      const dateArr = reportDate.value.split('-')
      const submitData = {
        empId: empId.value,
        empName: empName.value,
        // positionNo: selectedPositionValue.value,
        // positionName: selectedPosition.value,
        reportDate: reportDate.value,
        totalWorkHours: totalHours.value,
        totalCount: projectList.value.length,
        supplement: isSupplement || false,
        type: dataType,
        year: dateArr[0],
        month: dateArr[1],
        startDate: reportDate.value,
        endDate: reportDate.value,
        projectDetails: projectList.value.map(p => ({
          projectId: p.projectId,
          projectCode: p.projectCode,
          projectName: p.projectName,
          plmCode: p.plmCode,
          specModel: p.specModel,
          shellName: p.shellName,
          productType: p.productType,
          workHours: p.hours,
          stageComplete: p.completed,
          type: dataType
        })),
        leaveDetails: leaveDetails.value || []
      }
      await post('/h5-open-api/erp/h5/submit', submitData)
      // showToast({ message: '提交成功', type: 'success' })
      showTip('提交成功')
      timesheetStore.reset()
      loadUnSubmitReportDates()
      // 保留岗位选择，下次填报无需重新选择
      // router.push('/records')
    } catch (error) {
      // showToast(error.message || '提交失败，请稍后重试')
      showTip(error.message || '提交失败，请稍后重试')
    } finally {
      submitting.value = false
    }
  }

  onMounted(async () => {
    await loadHolidaysScheduleData()
    await loadEmpEntryAndLeaveInfo()
    await loadEmpAttendanceData(reportDate.value)
    loadCurrentDateLeaveInfo(reportDate.value)
    loadLoaderReportData(reportDate.value)
  })

  onActivated(() => {
    loadUnSubmitReportDates()
  })

  return {
    empId, empName, workHours, hasLeaveInfo, currOriginLeaveDay,currValidWorkHour,leaveDesc,
    reportDate, showDatePicker, dateValue, minDate, maxDate,holidayInfo,
    selectedPosition, showPositionPicker,
    showProjectSelector, projectList, projectCount, totalHours,
    submitting, onDateConfirm, onPositionConfirm,
    onRemoveProject, onHoursChange, onCompletedChange, onSubmit, 
    unSubmitDates, unSubmitDatesMessage
  }
}
