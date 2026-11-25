import { ref, computed, onMounted, onActivated, nextTick } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/modules/user.js'
import { useTimesheetStore } from '@/store/modules/timesheet.js'
import { get, post } from '@/utils/request.js'
import { showTip } from '@/utils/tip'
import dayjs from 'dayjs'

export function useTimesheet() {
  const router = useRouter()
  const route = useRoute()
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
  const currentEmpAttendanceDataIsNotExists = ref(false)
  const holidayInfo = ref({isHoliday: false, holidayDesc: '', isWorkDay: true, isWeekendDay: false})

  // 项目列表
  const showProjectSelector = ref(false)
  const projectList = computed(() => timesheetStore.projectList)
  const projectCount = computed(() => timesheetStore.projectCount)
  const totalHours = computed(() => timesheetStore.totalHours)
  // const isDL = computed(() => currentEmpPositionInfo.value?.empType === 'DL')
  const isDL = computed(() => (currentEmpPositionInfo.value?.salaryType || '2') != '2')

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
    hasLeaveInfo.value = false
    holidayInfo.value = {isHoliday: false, holidayDesc: '', isWorkDay: true, isWeekendDay: false}
    await loadEmpAttendanceData(reportDate.value)
    await loadCurrentDateLeaveInfo(reportDate.value)
    loadLoaderReportData(reportDate.value)
    calcHolidayInfoByDate(reportDate.value)
  }

  // 首页日历点击未填报日期跳转过来时，按该日期打开填报页
  function applyRouteDate() {
    const q = route.query.date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(q || '')) return false
    // 用过即清掉，避免之后每次激活都再次套用旧日期
    router.replace({ path: route.path })
    if (q === reportDate.value) return false
    reportDate.value = q
    dateValue.value = q.split('-')
    return true
  }

  async function loadCurrentDateLeaveInfo(reportDate) {
    try {
      const url = `/h5-open-api/erp/h5/get-leave-info?empId=${empId.value}&date=${reportDate}`
      const res = await get(url)

      /**** 不按考勤逻辑  ****/
      if(isDL.value || currentDateIsInHourlyTimeline(reportDate)){
        const atteWorkHours = attendanceWorkhoursData.value[reportDate]?.totalWorkHours || 0
        workHours.value = atteWorkHours
        hasLeaveInfo.value = false
        leaveDesc.value = ''
        leaveDetails.value = []
      }else{        
        if(res.data && res.data.length){
          const validLeaveItems = res.data.filter((item) => !(item.type || '').includes('出差')) || []
          hasLeaveInfo.value = true
          const totalLeaveHours =validLeaveItems.reduce((acc, cur) => acc + cur.currLeaveHour, 0)
          const totalValidWorkHour = 8 - totalLeaveHours
          workHours.value = holidayInfo.value?.isHoliday ? 0 : totalValidWorkHour
          currValidWorkHour.value = totalValidWorkHour
          leaveDesc.value = validLeaveItems.map((item) => item.type + " " + item.currLeaveHour + "h").join(';')
          leaveDetails.value = validLeaveItems.map((item) => ({ 
            leaveType: item.type,
            leaveHour: item.currLeaveHour,
            leaveDate: item.date
          }))
        }else{
          hasLeaveInfo.value = false
          let finalWorkHours = 0
          let desc = ''
          if(!currentEmpAttendanceDataIsNotExists.value){
            finalWorkHours = attendanceWorkhoursData.value[reportDate]?.workHours || 0
            if(finalWorkHours <= 0){
              const workType = attendanceWorkhoursData.value[reportDate]?.workType || ''
              desc = (workType.replace(/\d+$/ig, '').replace(/节日/ig, ''))
              hasLeaveInfo.value = true
            }
          }else{
            finalWorkHours = 8 
          }
          workHours.value = holidayInfo.value?.isHoliday ? 0 : finalWorkHours
          currValidWorkHour.value = 0
          leaveDesc.value = desc
          leaveDetails.value = []
        }
      }

      // /***按考勤逻辑 ***/
      // const attendanceMap = attendanceWorkhoursData.value || {}
      // const atteData = attendanceMap[reportDate] || {}
      // const finalWorkHours = getCurrentDateWorkHours(atteData,reportDate)
      // const workType = atteData.workType || ''
      // let finalLeaveDesc = ''
      // if (!isDL.value && finalWorkHours < 8) {
      //   let leaveDesc = workType.replace(/\d+$/ig, '')
      //   if (!workType.includes('节日')) {
      //     const leaveHours = atteData.leaveHours || 0
      //     const absentHours = atteData.absentHours || 0
      //     const descArr = []
      //     if (leaveHours > 0 && leaveDesc) {
      //       descArr.push(leaveDesc + leaveHours + 'h')
      //     }
      //     if (absentHours > 0 && leaveDesc) {
      //       descArr.push(leaveDesc + absentHours + 'h')
      //     }
      //     finalLeaveDesc = descArr.length ? descArr.join(';') : ''
      //     hasLeaveInfo.value = true
      //   } else if (workType.includes('节日')) {
      //     finalLeaveDesc = leaveDesc.replace(/节日/ig, '')
      //   }
      // }
      // workHours.value = finalWorkHours
      // leaveDesc.value = finalLeaveDesc
    } catch (e) {
      console.error('加载请假信息失败失败:', e)
    } finally {
    }
  } 

  function currentDateIsInNotRdTimeline (currentDate){
    const rdTypeRecords = currentEmpPositionInfo.value?.rdTypeList || []
    const date = dayjs(currentDate)
    return rdTypeRecords.some(record => {
      const rdType = record.rdType
      const startDate = dayjs(record.startDate)
      const endDate = dayjs(record.endDate)
      return '非研发' === rdType && (date.isSame(startDate) || date.isAfter(startDate)) && (date.isSame(endDate) || date.isBefore(endDate))
    })
}

function currentDateIsInHourlyTimeline (currentDate){
  const salTypeRecords = currentEmpPositionInfo.value?.salaryTypeList || []
  const date = dayjs(currentDate)
  return salTypeRecords.some(record => {
    const salaryType = record.salaryType
    const startDate = dayjs(record.startDate)
    const endDate = dayjs(record.endDate)
    return '时薪' === salaryType && (date.isSame(startDate) || date.isAfter(startDate)) && (date.isSame(endDate) || date.isBefore(endDate))
  })
}

  function getCurrentDateWorkHours(atteData,currentDate){
    let finalWorkHours = currentDateIsInHourlyTimeline(currentDate) || isDL.value ? atteData?.totalWorkHours || 0 : atteData?.workHours || 0
    const workType = atteData?.workType || ''
    // if (!isDL.value && finalWorkHours > 0 && workType.includes('节日')) {
    if (finalWorkHours > 0 && workType.includes('节日')) {
        finalWorkHours = 0
    }
    return finalWorkHours
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
      // calcHolidayInfoByDate(reportDate.value)
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
      currentEmpPositionInfo.value = {}
      console.error('加载员工入职离职信息数据失败:', e)
    } finally {
    }
  } 

  async function loadEmpAttendanceData(dateString) {
    try {
      // const url = `/h5-open-api/erp/h5/get-attendance-work-hours-map?empNo=${empId.value}&dates=${dateString}&isHourly=${isDL.value}`
      const url = `/h5-open-api/erp/h5/get-attendance-detail-map?empNo=${empId.value}&dates=${dateString}`
      const res = await get(url)
      attendanceWorkhoursData.value = res?.data || {}
      currentEmpAttendanceDataIsNotExists.value = Object.keys(res?.data || {}).length === 0
    } catch (e) {
      attendanceWorkhoursData.value = {}
      currentEmpAttendanceDataIsNotExists.value = true
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
    const attendanceData = attendanceWorkhoursData.value || {}
    let isHoliday = false
    let holidayDesc = ''

    /***不按考勤逻辑 ***/
    const atteWorkHours = (attendanceData[dateString] || {})?.totalWorkHours || 0
    if (current.isAfter(now)) {
      isHoliday = true
      holidayDesc = '未入职'
    } else if(currentDateIsInNotRdTimeline(current)){
      isHoliday = true
      holidayDesc = '非研发'
    } else if ((isWorkDay && isContainsInHolidayScheduleDays(dateStr) && !isDL.value && atteWorkHours <= 0) || (isWorkDay && isContainsInHolidayScheduleDays(dateStr) && isDL.value && atteWorkHours <= 0)) {
      isHoliday = true
      holidayDesc = '节假日'
    } else if ((isWeekendDay && isContainsInHolidayScheduleDays(dateStr) && !isDL.value && atteWorkHours > 0) || (isWeekendDay && isContainsInHolidayScheduleDays(dateStr) && isDL.value && atteWorkHours > 0)) {
      isHoliday = false
      holidayDesc = isDL.value ? '班' : '补班'
    } else if (isWeekendDay && isDL.value && atteWorkHours > 0) {
      isHoliday = false
      holidayDesc = '班'
    } else if (isWeekendDay && !isDL.value && atteWorkHours > 0) {
      isHoliday = false
      holidayDesc = ''
    }else if(isDL.value && atteWorkHours > 0){
      isHoliday = false
      holidayDesc = '班'
    }else {
      isHoliday = isDL.value ? true : isWeekendDay
      holidayDesc = isDL.value ? currentEmpAttendanceDataIsNotExists.value ? '无考勤' : '休' : '周末'
    }

    /*** 按考勤逻辑  */
    // const atteWorkHours = getCurrentDateWorkHours(attendanceData[dateString] || {},dateString)
    // const workType = attendanceData[dateString]?.workType || ''
    // const desc = currentEmpAttendanceDataIsNotExists.value ? '无考勤' : (workType.replace(/\d+$/ig, '').replace(/节日/ig, ''))
    // if (current.isAfter(now)) {
    //   isHoliday = true
    //   holidayDesc = '未入职'
    //   isHoliday = true
    // } else if(atteWorkHours <= 0){
    //   isHoliday = true
    //   holidayDesc = leaveDesc.value || desc
    // } else {
    //   isHoliday = atteWorkHours <= 0
    //   holidayDesc = leaveDesc.value || desc
    // }

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
    message += `总工时 <span style="font-weight: bold;color: #ee0a24;">${totalHours.value.toFixed(2)}h</span>`
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

  function autoAssignWorkHour() {
    const count = projectList.value.length
    if(count <= 0) return
    let arr = []
    try{
      arr = randomAssignWorkHour(count, workHours.value)
    }catch(e){
      showTip('分配工时失败:' + (e.message || ''))
    }
    if(!arr || !arr.length) return
    for (let i = 0; i < count; i++) {
      projectList.value[i]['hours'] = arr[i]
    }
  }

  function randomAssignWorkHour(projectCount, totalHour){
    if (projectCount < 1) {
      throw new Error("项目数不能小于1")
    }
    if (totalHour <= 0) {
      throw new Error("总工时必须大于0")
    }

    const unitStep = 0.5
    // 总共有多少个0.5单元
    const totalUnit = Math.floor(totalHour / unitStep)
    const remainder = totalHour - totalUnit * unitStep

    // 最多能支撑多少个项目拿到保底0.5
    const maxAvailableProject = totalUnit
    // 初始化全部为0
    const hourList = new Array(projectCount).fill(0)

    if (maxAvailableProject <= 0) {
      // 总工时不足0.5，全部单元数为0，只有零头，随机给一个项目
      if (remainder > 0) {
        const randomIdx = Math.floor(Math.random() * projectCount)
        hourList[randomIdx] = remainder
      }
      return hourList.map(val => Number(val.toFixed(2)))
    }

    // 随机挑选 maxAvailableProject 个不同下标，用来分配保底0.5
    const allIndex = Array.from({ length: projectCount }, (_, i) => i)
    // 洗牌取前N个
    for (let i = allIndex.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[allIndex[i], allIndex[j]] = [allIndex[j], allIndex[i]]
    }
    const selectedIndexes = allIndex.slice(0, maxAvailableProject)

    // 先给选中的项目每个分配 0.5（1unit）
    const unitsMap = {}
    selectedIndexes.forEach(idx => {
      unitsMap[idx] = 1
    })
    let remainUnit = totalUnit - selectedIndexes.length

    // 多余的unit继续随机分给已经选中的项目
    while (remainUnit > 0) {
      const randomPick = selectedIndexes[Math.floor(Math.random() * selectedIndexes.length)]
      unitsMap[randomPick] += 1
      remainUnit -= 1
    }

    // 回填到工时数组
    Object.keys(unitsMap).forEach(key => {
      const idx = Number(key)
      hourList[idx] = unitsMap[idx] * unitStep
    })

    // 零头随机加到其中一个已分配的项目
    if (remainder > 0 && selectedIndexes.length > 0) {
      const randomIdx = selectedIndexes[Math.floor(Math.random() * selectedIndexes.length)]
      hourList[randomIdx] += remainder
    }

    return hourList.map(val => Number(val.toFixed(2)))
  }


  // 首页红点日期只消费一次；首次挂载由 onMounted 处理，避免重复请求
  let isFirstActivation = true

  onMounted(async () => {
    await loadHolidaysScheduleData()
    await loadEmpEntryAndLeaveInfo()
    applyRouteDate()
    await loadEmpAttendanceData(reportDate.value)
    await loadCurrentDateLeaveInfo(reportDate.value)
    loadLoaderReportData(reportDate.value)
    calcHolidayInfoByDate(reportDate.value)
  })

  onActivated(async () => {
    loadUnSubmitReportDates()
    if (isFirstActivation) {
      isFirstActivation = false
      return
    }
    if (!applyRouteDate()) return
    await loadEmpAttendanceData(reportDate.value)
    await loadCurrentDateLeaveInfo(reportDate.value)
    loadLoaderReportData(reportDate.value)
    await calcHolidayInfoByDate(reportDate.value)
  })

  return {
    empId, empName, workHours, hasLeaveInfo, currOriginLeaveDay,currValidWorkHour,leaveDesc,
    reportDate, showDatePicker, dateValue, minDate, maxDate,holidayInfo,
    selectedPosition, showPositionPicker,
    showProjectSelector, projectList, projectCount, totalHours,
    submitting, onDateConfirm, onPositionConfirm,
    onRemoveProject, onHoursChange, onCompletedChange, onSubmit, 
    unSubmitDates, unSubmitDatesMessage,autoAssignWorkHour
  }
}
