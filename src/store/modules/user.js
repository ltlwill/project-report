/**
 * 用户状态管理
 * 管理 token、用户信息、登录登出
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { showToast } from 'vant'
import {
  getToken, setToken, removeToken,
  getUserInfo, setUserInfo, removeUserInfo,
  getRemembered, setRemembered, removeRemembered
} from '@/utils/auth.js'
import { loginRequest, post, get } from '@/utils/request.js'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref(getToken() || '')
  const userInfo = ref(getUserInfo() || {})

  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const empId = computed(() => userInfo.value.empId || '')
  const empName = computed(() => userInfo.value.empName || '')
  const avatar = computed(() => userInfo.value.avatar || '')
  const isApprover = computed(() => !!userInfo.value.isApprover)

  /**
   * 登录
   * @param {string} empIdVal - 工号
   * @param {string} password - 密码
   * @param {boolean} remember - 是否记住
   */
  async function login(empIdVal, password, remember = false) {
    // const res = await loginRequest('/auth/login', {
    const res = await loginRequest('/h5-open-api/erp/h5/login', {  
      empId: empIdVal,
      password
    })

    const data = res.data || res
    token.value = data.token
    userInfo.value = {
      empId: data.empId || empIdVal,
      empName: data.empName || '',
      avatar: data.avatar || '',
      workHours: data.workHours || 8,
      ...data
    }

    setToken(data.token)
    setUserInfo(userInfo.value)

    if (remember) {
      setRemembered(empIdVal, password)
    } else {
      removeRemembered()
    }

    return res
  }

  /**
   * 登出
   */
  async function logout() {
    try {
      const res = await post('/h5-open-api/erp/h5/logout')
      token.value = ''
      userInfo.value = {}
      removeToken()
      removeUserInfo()
      // 先切到登录页 URL 再刷新，避免 redirect 参数携带当前页路径
      window.location.href = window.location.pathname + '#/login'
      // window.location.reload()
    } catch (error) {
      showToast(error.message || '退出登录失败')
      console.error('退出登录失败:', error)
    }
  }

  /**
   * 修改密码
   */
  async function changePassword(empId, password, oldPassword) {
    return await post('/h5-open-api/erp/h5/update-pwd', {
      empId,
      password,
      oldPassword
    })
  }

  /**
   * 刷新用户信息
   */
  function refreshUserInfo(info) {
    userInfo.value = { ...userInfo.value, ...info }
    setUserInfo(userInfo.value)
  }

  /**
   * 从后端拉取最新用户信息（含权限字段）
   * 用于刷新页面时同步最新权限
   */
  async function fetchUserInfo() {
    try {
      const res = await get('/h5-open-api/erp/h5/get-user-info')
      const data = res.data || res
      userInfo.value = { ...userInfo.value, ...data }
      setUserInfo(userInfo.value)
    } catch (e) {
      console.error('获取用户信息失败:', e)
    }
  }

  return {
    token, userInfo,
    isLoggedIn, empId, empName, avatar, isApprover,
    login, logout, changePassword, refreshUserInfo, fetchUserInfo,
    getRemembered
  }
})
