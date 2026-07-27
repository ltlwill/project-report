/**
 * 原生 fetch 封装
 * 支持 GET、POST 请求，统一携带 token，统一拦截认证失败
 * 支持 mock 数据拦截（开发阶段）
 */
import { showConfirmDialog, showFailToast } from 'vant'
import { getToken, removeToken, removeUserInfo } from './auth.js'
import { matchMock, USE_MOCK } from '@/mock/index.js'
import { showTip } from './tip.js'

// 基础配置
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Mock 模式下打印日志
if (USE_MOCK) {
  console.log('[Mock] Mock 数据已启用')
}

/**
 * 统一处理 401 跳转登录
 */
function handleUnauthorized() {
  showConfirmDialog({ title: '提示', message: '登录已过期，请重新登录' })
  .then(() => {
    removeToken()
    removeUserInfo()
    // 避免循环跳转，已在登录页时不跳
    if (window.location.hash !== '#/login' && window.location.pathname !== '/login') {
      window.location.hash = ''
      window.location.href = window.location.href.split('#')[0] + '#/login'
    }
  })
  .catch(() => {})
  
}

/**
 * 通用请求方法
 * @param {string} url - 请求路径（不含 base）
 * @param {object} options - 配置项
 * @param {string} options.method - 请求方法
 * @param {object} options.params - GET 请求查询参数
 * @param {object} options.data - POST 请求体数据
 * @param {boolean} options.isLogin - 是否为登录接口（不携带 token）
 * @returns {Promise<object>} 响应数据
 */
async function request(url, options = {}) {
  const { method = 'GET', params, data, isLogin = false } = options

  // ========== Mock 拦截 ==========
  if (USE_MOCK) {
    const mockResult = await matchMock(url, { method, params, data })
    if (mockResult !== null) {
      console.log(`[Mock] ${method} ${url}`, mockResult)
      // mock 返回的 401 错误也需要拦截
      if (mockResult.code === 401 || mockResult.code === 4001) {
        handleUnauthorized()
        throw new Error(mockResult.msg || '登录已过期，请重新登录')
      }
      if (mockResult.code !== undefined && mockResult.code !== 0 && mockResult.code !== 200) {
        throw new Error(mockResult.msg || '请求失败')
      }
      return mockResult
    }
  }

  // ========== 真实请求 ==========
  // 构建完整 URL
  let fullUrl = BASE_URL + url

  // GET 请求拼接查询参数
  if (method === 'GET' && params) {
    const query = new URLSearchParams(params).toString()
    if (query) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + query
    }
  }

  // 构建请求头
  const headers = {
    'Content-Type': 'application/json'
  }

  // 非登录接口携带 token
  if (!isLogin) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  // 构建 fetch 配置
  const fetchOptions = {
    method,
    headers
  }

  // POST/PUT 请求添加请求体
  if ((method === 'POST' || method === 'PUT') && data) {
    fetchOptions.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(fullUrl, fetchOptions)

    // 401 未授权处理
    if (response.status === 401) {
      handleUnauthorized()
      throw new Error('登录已过期，请重新登录')
    }

    // 响应解析
    const result = await response.json()

    // 业务层 token 过期判断（后端约定 code）
    if (result.code === 401 || result.code === 4001) {
      handleUnauthorized()
      throw new Error(result.msg || '登录已过期，请重新登录')
    }

    // 非成功状态抛出错误
    if (result.code !== undefined && result.code !== 0 && result.code !== 200) {
      // showFailToast(result.msg || '请求失败')
      showTip(result.msg || '请求失败')
      throw new Error(result.msg || '请求失败')
    }

    return result
  } catch (error) {
    // 网络错误处理
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      // showFailToast({message: '网络连接失败，请检查网络', zIndex: 999999})
      showTip('网络连接失败，请检查网络')
      throw new Error('网络连接失败，请检查网络')
    }
    throw error
  }
}

/**
 * GET 请求
 * @param {string} url - 请求路径
 * @param {object} params - 查询参数
 * @param {object} options - 其他配置
 */
export function get(url, params = {}, options = {}) {
  return request(url, { method: 'GET', params, ...options })
}

/**
 * POST 请求
 * @param {string} url - 请求路径
 * @param {object} data - 请求体
 * @param {object} options - 其他配置
 */
export function post(url, data = {}, options = {}) {
  return request(url, { method: 'POST', data, ...options })
}

/**
 * 登录专用请求（不携带 token）
 * @param {string} url - 请求路径
 * @param {object} data - 请求体
 */
export function loginRequest(url, data = {}) {
  return request(url, { method: 'POST', data, isLogin: true })
}

export default { get, post, loginRequest }
