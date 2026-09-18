import { ref } from 'vue'

/**
 * 详情页审批状态变更的共享响应式标记
 * 详情页审批成功后写入，审批列表页 watch 此 ref 更新对应记录
 */
export const approvalUpdate = ref({ id: null, status: null, timestamp: 0 })

export const removeItem = ref({id: null, timestamp: 0})
