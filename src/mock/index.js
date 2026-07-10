/**
 * Mock 拦截器
 * 根据请求 URL 和方法返回对应的 mock 数据
 * 当后端接口就绪后，将 VITE_USE_MOCK 设为 false 即可关闭
 */
import {
  mockUser,
  mockProjects,
  mockRecords,
  mockRecordDetails,
  mockApprovalRecords,
  submittedRecords
} from './data.js'

// 是否启用 mock（默认启用）
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// 自增 ID
let autoId = 100

/**
 * 模拟网络延迟
 */
function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 包装统一响应格式
 */
function success(data) {
  return { code: 200, msg: 'success', data }
}

function error(msg, code = 500) {
  return { code, msg, data: null }
}

/**
 * 根据 URL 和参数匹配并返回 mock 数据
 * @param {string} url - 请求 URL（不含 base）
 * @param {object} options - 请求配置 { method, params, data }
 * @returns {object|null} - 匹配的 mock 响应，未匹配返回 null
 */
export async function matchMock(url, options = {}) {
  if (!USE_MOCK) return null

  const { method = 'GET', params = {}, data = {} } = options
  await delay(200 + Math.random() * 300)

  // ========== 登录 ==========
  if (url === '/auth/login' && method === 'POST') {
    const { empId, password } = data
    if (!empId || !password) {
      return error('工号和密码不能为空')
    }
    // 模拟：任意工号 + 密码长度>=4 即可登录
    if (password.length < 4) {
      return error('工号或密码错误', 401)
    }
    return success({
      ...mockUser,
      empId,
      empName: empId === '10086' ? '张三' : `用户${empId}`,
      token: 'mock_token_' + Date.now()
    })
  }

  // ========== 修改密码 ==========
  if (url === '/auth/change-password' && method === 'POST') {
    const { oldPassword, newPassword } = data
    if (!oldPassword || !newPassword) {
      return error('请填写完整信息')
    }
    return success({ message: '修改成功' })
  }

  // ========== 首页统计 ==========
  if (url === '/home/stats' && method === 'GET') {
    return success({
      projectCount: mockProjects.length,
      weekHours: 32.5,
      monthHours: 128.0
    })
  }

  // ========== 最近填报 ==========
  if (url === '/timesheet/recent' && method === 'GET') {
    const limit = Number(params.limit) || 5
    const recent = [...mockRecords, ...submittedRecords]
      .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      .slice(0, limit)
    return success(recent)
  }

  // ========== 项目列表 ==========
  if (url === '/project/list' && method === 'GET') {
    const keyword = (params.keyword || '').trim()
    let list = [...mockProjects]
    if (keyword) {
      list = list.filter(p =>
        p.projectName.includes(keyword) || p.projectNo.includes(keyword)
      )
    }
    return success(list)
  }

  // ========== 提交填报 ==========
  if (url === '/timesheet/submit' && method === 'POST') {
    const now = new Date()
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`
    const totalHours = (data.projectDetails || []).reduce((s, p) => s + (Number(p.hours) || 0), 0)
    const newRecord = {
      id: String(++autoId),
      empId: data.empId,
      empName: data.empName,
      position: data.position,
      reportDate: data.reportDate,
      createTime: timeStr,
      totalHours,
      status: 0,
      approvalRemark: '',
      projectDetails: data.projectDetails || []
    }
    submittedRecords.unshift(newRecord)
    // 同时添加到详情映射
    mockRecordDetails[newRecord.id] = newRecord
    return success({ id: newRecord.id, message: '提交成功' })
  }

  // ========== 填报记录列表 ==========
  if (url === '/timesheet/records' && method === 'GET') {
    const keyword = (params.keyword || '').trim()
    let list = [...mockRecords, ...submittedRecords]
      .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
    if (keyword) {
      list = list.filter(r =>
        r.empName.includes(keyword) || r.reportDate.includes(keyword)
      )
    }
    return success(list)
  }

  // ========== 填报详情 ==========
  if (url.match(/^\/timesheet\/detail\/(.+)$/) && method === 'GET') {
    const id = url.match(/^\/timesheet\/detail\/(.+)$/)[1]
    const detail = mockRecordDetails[id]
    if (detail) {
      return success(detail)
    }
    return error('记录不存在', 404)
  }

  // ========== 审批列表 ==========
  if (url === '/timesheet/approval-list' && method === 'GET') {
    const keyword = (params.keyword || '').trim()
    let list = [...mockApprovalRecords]
    if (keyword) {
      list = list.filter(r =>
        r.empName.includes(keyword) || r.reportDate.includes(keyword)
      )
    }
    return success(list)
  }

  // ========== 审批操作 ==========
  if (url === '/timesheet/approve' && method === 'POST') {
    const { id, status, remark } = data
    // 同步更新审批列表数据
    const record = mockApprovalRecords.find(r => r.id === id)
    if (record) {
      record.status = status
      record.approvalRemark = remark || ''
    }
    // 同步更新详情数据，保证详情页状态一致
    if (mockRecordDetails[id]) {
      mockRecordDetails[id].status = status
      mockRecordDetails[id].approvalRemark = remark || ''
    }
    return success({ message: '审批完成' })
  }

  // 未匹配到任何 mock 路由
  return null
}
