/**
 * Token 存取工具
 * 使用 localStorage 存储 token 及记住的账号密码
 */

const TOKEN_KEY = 'pm_token'
const REMEMBER_KEY = 'pm_remember'
const USER_KEY = 'pm_user'

// ========== Token 相关 ==========

/** 获取 token */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/** 设置 token */
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

/** 移除 token */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// ========== 用户信息相关 ==========

/** 获取缓存的用户信息 */
export function getUserInfo() {
  const data = localStorage.getItem(USER_KEY)
  try {
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

/** 设置用户信息 */
export function setUserInfo(info) {
  localStorage.setItem(USER_KEY, JSON.stringify(info))
}

/** 移除用户信息 */
export function removeUserInfo() {
  localStorage.removeItem(USER_KEY)
}

// ========== 记住账号密码相关 ==========

/** 获取记住的工号密码 */
export function getRemembered() {
  const data = localStorage.getItem(REMEMBER_KEY)
  try {
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

/** 保存记住的工号密码 */
export function setRemembered(empId, password) {
  localStorage.setItem(REMEMBER_KEY, JSON.stringify({ empId, password }))
}

/** 移除记住的工号密码 */
export function removeRemembered() {
  localStorage.removeItem(REMEMBER_KEY)
}
