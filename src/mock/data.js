/**
 * Mock 数据集合
 * 所有接口的模拟数据，用于前端开发阶段
 */

// ========== 用户相关 ==========

const mockUser = {
  empId: '10086',
  empName: '张三',
  avatar: '',
  workHours: 8,
  token: 'mock_token_abc123xyz_' + Date.now()
}

// ========== 项目列表 ==========

const mockProjects = [
  { projectId: '1', projectCode: 'PRJ-001', projectName: '企业管理系统开发' },
  { projectId: '2', projectCode: 'PRJ-002', projectName: '移动端APP开发' },
  { projectId: '3', projectCode: 'PRJ-003', projectName: '数据分析平台建设' },
  { projectId: '4', projectCode: 'PRJ-004', projectName: '客户关系管理系统' },
  { projectId: '5', projectCode: 'PRJ-005', projectName: '供应链管理系统' },
  { projectId: '6', projectCode: 'PRJ-006', projectName: '人力资源系统优化' },
  { projectId: '7', projectCode: 'PRJ-007', projectName: '财务系统升级' },
  { projectId: '8', projectCode: 'PRJ-008', projectName: '电商平台维护' },
  { projectId: '9', projectCode: 'PRJ-009', projectName: '智能客服系统' },
  { projectId: '10', projectCode: 'PRJ-010', projectName: '物联网平台开发' }
]

// ========== 填报记录 ==========

const mockRecords = [
  {
    id: '1', empId: '10086', empName: '张三', position: '前端开发',
    reportDate: '2025-07-01', createTime: '2025-07-01 18:30:00',
    totalHours: 8, status: 1, approvalRemark: '工作认真，予以通过'
  },
  {
    id: '2', empId: '10086', empName: '张三', position: '前端开发',
    reportDate: '2025-06-30', createTime: '2025-06-30 17:45:00',
    totalHours: 7.5, status: 0, approvalRemark: ''
  },
  {
    id: '3', empId: '10086', empName: '张三', position: '前端开发',
    reportDate: '2025-06-29', createTime: '2025-06-29 18:00:00',
    totalHours: 8, status: 2, approvalRemark: '工时填报有误，请核实'
  },
  {
    id: '4', empId: '10086', empName: '张三', position: '前端开发',
    reportDate: '2025-06-28', createTime: '2025-06-28 18:10:00',
    totalHours: 6.5, status: 1, approvalRemark: ''
  },
  {
    id: '5', empId: '10086', empName: '张三', position: '前端开发',
    reportDate: '2025-06-27', createTime: '2025-06-27 17:55:00',
    totalHours: 8, status: 1, approvalRemark: ''
  }
]

// ========== 填报详情 ==========

const mockRecordDetails = {
  '1': {
    id: '1', empId: '10086', empName: '张三', position: '前端开发',
    reportDate: '2025-07-01', createTime: '2025-07-01 18:30:00',
    totalHours: 8, status: 1, approvalRemark: '工作认真，予以通过',
    projectDetails: [
      { projectId: '1', projectCode: 'PRJ-001', projectName: '企业管理系统开发', hours: 4 },
      { projectId: '3', projectCode: 'PRJ-003', projectName: '数据分析平台建设', hours: 2.5 },
      { projectId: '5', projectCode: 'PRJ-005', projectName: '供应链管理系统', hours: 1.5 }
    ]
  },
  '2': {
    id: '2', empId: '10086', empName: '张三', position: '前端开发',
    reportDate: '2025-06-30', createTime: '2025-06-30 17:45:00',
    totalHours: 7.5, status: 0, approvalRemark: '',
    projectDetails: [
      { projectId: '2', projectCode: 'PRJ-002', projectName: '移动端APP开发', hours: 5 },
      { projectId: '4', projectCode: 'PRJ-004', projectName: '客户关系管理系统', hours: 2.5 }
    ]
  },
  '3': {
    id: '3', empId: '10086', empName: '张三', position: '前端开发',
    reportDate: '2025-06-29', createTime: '2025-06-29 18:00:00',
    totalHours: 8, status: 2, approvalRemark: '工时填报有误，请核实',
    projectDetails: [
      { projectId: '1', projectCode: 'PRJ-001', projectName: '企业管理系统开发', hours: 3 },
      { projectId: '6', projectCode: 'PRJ-006', projectName: '人力资源系统优化', hours: 3 },
      { projectId: '7', projectCode: 'PRJ-007', projectName: '财务系统升级', hours: 2 }
    ]
  },
  '4': {
    id: '4', empId: '10086', empName: '张三', position: '前端开发',
    reportDate: '2025-06-28', createTime: '2025-06-28 18:10:00',
    totalHours: 6.5, status: 1, approvalRemark: '',
    projectDetails: [
      { projectId: '8', projectCode: 'PRJ-008', projectName: '电商平台维护', hours: 4 },
      { projectId: '9', projectCode: 'PRJ-009', projectName: '智能客服系统', hours: 2.5 }
    ]
  },
  '5': {
    id: '5', empId: '10086', empName: '张三', position: '前端开发',
    reportDate: '2025-06-27', createTime: '2025-06-27 17:55:00',
    totalHours: 8, status: 1, approvalRemark: '',
    projectDetails: [
      { projectId: '10', projectCode: 'PRJ-010', projectName: '物联网平台开发', hours: 8 }
    ]
  },
  // ========== 审批记录详情（id 对应 mockApprovalRecords） ==========
  '20': {
    id: '20', empId: '10087', empName: '李四', position: '后端开发',
    reportDate: '2025-07-02', createTime: '2025-07-02 18:20:00',
    totalHours: 8, status: 0, approvalRemark: '',
    projectDetails: [
      { projectId: '1', projectCode: 'PRJ-001', projectName: '企业管理系统开发', hours: 4 },
      { projectId: '2', projectCode: 'PRJ-002', projectName: '移动端APP开发', hours: 4 }
    ]
  },
  '21': {
    id: '21', empId: '10088', empName: '王五', position: '测试工程师',
    reportDate: '2025-07-02', createTime: '2025-07-02 17:50:00',
    totalHours: 7.5, status: 0, approvalRemark: '',
    projectDetails: [
      { projectId: '3', projectCode: 'PRJ-003', projectName: '数据分析平台建设', hours: 3.5 },
      { projectId: '5', projectCode: 'PRJ-005', projectName: '供应链管理系统', hours: 4 }
    ]
  },
  '22': {
    id: '22', empId: '10089', empName: '赵六', position: '项目经理',
    reportDate: '2025-07-01', createTime: '2025-07-01 18:00:00',
    totalHours: 8, status: 0, approvalRemark: '',
    projectDetails: [
      { projectId: '4', projectCode: 'PRJ-004', projectName: '客户关系管理系统', hours: 2 },
      { projectId: '6', projectCode: 'PRJ-006', projectName: '人力资源系统优化', hours: 3 },
      { projectId: '7', projectCode: 'PRJ-007', projectName: '财务系统升级', hours: 3 }
    ]
  },
  '23': {
    id: '23', empId: '10090', empName: '孙七', position: '全栈开发',
    reportDate: '2025-07-01', createTime: '2025-07-01 17:30:00',
    totalHours: 6.5, status: 0, approvalRemark: '',
    projectDetails: [
      { projectId: '8', projectCode: 'PRJ-008', projectName: '电商平台维护', hours: 2 },
      { projectId: '9', projectCode: 'PRJ-009', projectName: '智能客服系统', hours: 2 },
      { projectId: '10', projectCode: 'PRJ-010', projectName: '物联网平台开发', hours: 2.5 }
    ]
  },
  '24': {
    id: '24', empId: '10091', empName: '周八', position: '产品经理',
    reportDate: '2025-06-30', createTime: '2025-06-30 18:15:00',
    totalHours: 8, status: 0, approvalRemark: '',
    projectDetails: [
      { projectId: '1', projectCode: 'PRJ-001', projectName: '企业管理系统开发', hours: 5 },
      { projectId: '3', projectCode: 'PRJ-003', projectName: '数据分析平台建设', hours: 3 }
    ]
  }
}

// ========== 待审批列表 ==========

const mockApprovalRecords = [
  {
    id: '20', empId: '10087', empName: '李四', position: '后端开发',
    reportDate: '2025-07-02', createTime: '2025-07-02 18:20:00',
    totalHours: 8, status: 0
  },
  {
    id: '21', empId: '10088', empName: '王五', position: '测试工程师',
    reportDate: '2025-07-02', createTime: '2025-07-02 17:50:00',
    totalHours: 7.5, status: 0
  },
  {
    id: '22', empId: '10089', empName: '赵六', position: '项目经理',
    reportDate: '2025-07-01', createTime: '2025-07-01 18:00:00',
    totalHours: 8, status: 0
  },
  {
    id: '23', empId: '10090', empName: '孙七', position: '全栈开发',
    reportDate: '2025-07-01', createTime: '2025-07-01 17:30:00',
    totalHours: 6.5, status: 0
  },
  {
    id: '24', empId: '10091', empName: '周八', position: '产品经理',
    reportDate: '2025-06-30', createTime: '2025-06-30 18:15:00',
    totalHours: 8, status: 0
  }
]

// ========== 模拟存储（用于增删改操作） ==========
let submittedRecords = []
let nextRecordId = 100

// ========== 导出所有 mock 数据 ==========

export {
  mockUser,
  mockProjects,
  mockRecords,
  mockRecordDetails,
  mockApprovalRecords,
  submittedRecords,
  nextRecordId
}
