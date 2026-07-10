import { ref, watch, computed } from 'vue'
import { get } from '@/utils/request.js'
import { useTimesheetStore } from '@/store/modules/timesheet.js'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export function useProjectSelector(props, emit) {
  const timesheetStore = useTimesheetStore()

  const keyword = ref('')
  const loading = ref(false)
  const projectList = ref([])

  const showPopup = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  function isAdded(projectId) {
    return timesheetStore.isProjectAdded(projectId)
  }

  async function loadProjects() {
    loading.value = true
    try {
      const url = USE_MOCK ? '/project/list' : '/h5-open-api/erp/h5/project-list'
      const res = await get(url, { keyword: keyword.value })
      const data = res.data || res
      projectList.value = Array.isArray(data) ? data : (data.list || [])
    } catch (e) {
      console.error('加载项目列表失败:', e)
      projectList.value = []
    } finally {
      loading.value = false
    }
  }

  function onSearch() {
    loadProjects()
  }

  function onAdd(project) {
    timesheetStore.addProject(project)
    emit('add', project)
  }

  function onClose() {
    showPopup.value = false
    keyword.value = ''
  }

  watch(showPopup, (val) => {
    if (val) {
      keyword.value = ''
      loadProjects()
    }
  })

  return {
    keyword,
    loading,
    projectList,
    showPopup,
    isAdded,
    onSearch,
    onAdd,
    onClose
  }
}
