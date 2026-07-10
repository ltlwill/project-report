import { ref, computed, onMounted } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user.js'
import { useTimesheetStore } from '@/store/modules/timesheet.js'
import { get, post } from '@/utils/request.js'
import { showTip } from '@/utils/tip'

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
  const leaveType = ref('')

  // 日期相关
  const now = new Date()
  const showDatePicker = ref(false)
  const reportDate = ref(formatDateStr(now))
  const dateValue = ref([
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ])
  const minDate = new Date(now.getFullYear() - 1, 0, 1)
  // const maxDate = new Date(now.getFullYear() + 1, 11, 31)
  const maxDate = now


  // 岗位相关
  const showPositionPicker = ref(false)
  // 从 localStorage 读取上次选择的岗位
  const cachedPosition = JSON.parse(localStorage.getItem('last_position') || 'null')
  const selectedPosition = ref(cachedPosition?.text || '')
  const selectedPositionValue = ref(cachedPosition?.value || '')

  const positionColumns = [
    { text: '业务负责人', value: 'businessManager' },
    { text: '研发技术总工', value: 'techChiefEngineer' },
    { text: 'PM', value: 'pm' },
    { text: '光学设计', value: 'opticalDesigner' },
    { text: '规格书设计', value: 'specDesigner' },
    { text: '机械设计', value: 'mechanicalDesigner' },
    { text: '软件设计', value: 'softwareDesigner' },
    { text: '电子设计', value: 'electronicDesigner' },
    { text: '物料齐套', value: 'materialKittingPerson' },
    { text: '开单', value: 'orderClerk' },
    { text: 'α样品制作', value: 'alphaSampleProducer' },
    { text: '销售人员', value: 'salesPerson' },
    { text: 'PMC人员', value: 'pmc' },
    { text: '大批量负责人', value: 'massProductionManager' },
  ]

  // 项目列表
  const showProjectSelector = ref(false)
  const projectList = computed(() => timesheetStore.projectList)
  const projectCount = computed(() => timesheetStore.projectCount)
  const totalHours = computed(() => timesheetStore.totalHours)

  // 提交状态
  const submitting = ref(false)

  function formatDateStr(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  function onDateConfirm({ selectedValues }) {
    reportDate.value = selectedValues.join('-')
    showDatePicker.value = false
    loadCurrentDateLeaveInfo(reportDate.value)
  }

  async function loadCurrentDateLeaveInfo(reportDate) {
    try {
      const url = `/h5-open-api/erp/h5/get-leave-info?empId=${empId.value}&date=${reportDate}`
      const res = await get(url)
      if(res.data){
        hasLeaveInfo.value = true
        workHours.value = res.data?.currValidWorkHour
        currOriginLeaveDay.value = res.data?.currOriginLeaveDay
        leaveType.value = res.data?.type || '请假'
      }else{
        hasLeaveInfo.value = false
        workHours.value = 8
        currOriginLeaveDay.value = 0
        leaveType.value = ''
      }
    } catch (e) {
      console.error('加载请假信息失败失败:', e)
    } finally {
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

  async function onSubmit() {
    // 校验
    if (!reportDate.value) {
      // showToast('请选择汇报日期')
      showTip('请选择汇报日期')
      return
    }
    if (!selectedPosition.value) {
      // showToast('请选择岗位')
      showTip('请选择岗位')
      return
    }
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
    // if(totalHours.value !== 8){
    //   showTip('总工时不等于8小时')  
    //   return
    // }
    if(projectList.value.some(p => p.hours <= 0)){
      showTip(`项目工时必须大于0`)
      return
    }

    try {
      await showConfirmDialog({
        title: '确认提交',
        message: `确认提交 ${reportDate.value} 的工时填报？\n共 ${projectCount.value} 个项目，总工时 ${totalHours.value.toFixed(1)}h`
      })
    } catch {
      return
    }

    submitting.value = true
    try {
      const submitData = {
        empId: empId.value,
        empName: empName.value,
        positionNo: selectedPositionValue.value,
        positionName: selectedPosition.value,
        reportDate: reportDate.value,
        totalWorkHours: totalHours.value,
        totalCount: projectList.value.length,
        projectDetails: projectList.value.map(p => ({
          projectId: p.projectId,
          projectCode: p.projectCode,
          projectName: p.projectName,
          plmCode: p.plmCode,
          specModel: p.specModel,
          shellName: p.shellName,
          productType: p.productType,
          workHours: p.hours,
          stageComplete: p.completed
        }))
      }
      await post('/h5-open-api/erp/h5/submit', submitData)
      // showToast({ message: '提交成功', type: 'success' })
      showTip('提交成功')
      timesheetStore.reset()
      // 保留岗位选择，下次填报无需重新选择
      // router.push('/records')
    } catch (error) {
      // showToast(error.message || '提交失败，请稍后重试')
      showTip(error.message || '提交失败，请稍后重试')
    } finally {
      submitting.value = false
    }
  }

  onMounted(() => {
    loadCurrentDateLeaveInfo(reportDate.value)
  })

  return {
    empId, empName, workHours, hasLeaveInfo, currOriginLeaveDay,leaveType,
    reportDate, showDatePicker, dateValue, minDate, maxDate,
    selectedPosition, showPositionPicker, positionColumns,
    showProjectSelector, projectList, projectCount, totalHours,
    submitting,
    onDateConfirm, onPositionConfirm,
    onRemoveProject, onHoursChange, onCompletedChange, onSubmit
  }
}
