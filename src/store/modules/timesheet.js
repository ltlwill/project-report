/**
 * 工时填报状态管理
 * 管理当前填报的项目列表、工时汇总
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTimesheetStore = defineStore('timesheet', () => {
  // 今日工作项目列表
  const projectList = ref([])

  // 计算属性
  const projectCount = computed(() => projectList.value.length)
  const totalHours = computed(() => {
    return projectList.value.reduce((sum, item) => sum + (Number(item.hours) || 0), 0)
  })

  /** 添加项目到列表 */
  function addProject(project) {
    const exists = projectList.value.find(p => p.projectId === project.projectId)
    if (!exists) {
      projectList.value.push({
        projectId: project.projectId,
        projectCode: project.projectCode || '',
        projectName: project.projectName || '',
        plmCode: project.plmCode || '',
        productType: project.productType || '',
        hours: 0,
        completed: false
      })
    }
  }

  /** 移除项目 */
  function removeProject(projectId) {
    projectList.value = projectList.value.filter(p => p.projectId !== projectId)
  }

  /** 设置项目工时 */
  function setProjectHours(projectId, hours) {
    const project = projectList.value.find(p => p.projectId === projectId)
    if (project) {
      project.hours = Number(hours) || 0
    }
  }

  /** 设置项目阶段完成状态 */
  function setProjectCompleted(projectId, completed) {
    const project = projectList.value.find(p => p.projectId === projectId)
    if (project) {
      project.completed = !!completed
    }
  }

  /** 判断项目是否已添加 */
  function isProjectAdded(projectId) {
    return projectList.value.some(p => p.projectId === projectId)
  }

  /** 清空项目列表 */
  function clearProjects() {
    projectList.value = []
  }

  /** 重置填报 */
  function reset() {
    clearProjects()
  }

  return {
    projectList,
    projectCount, totalHours,
    addProject, removeProject, setProjectHours, setProjectCompleted,
    isProjectAdded, clearProjects, reset
  }
})
