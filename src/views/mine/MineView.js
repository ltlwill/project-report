import { ref, reactive, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/store/modules/user.js'
import { showTip } from '@/utils/tip.js'


/**
 * 轻量级提示（纯 DOM，不经过 Vant 遮罩层管理器）
 * 仅用于密码修改场景，避免 Popup 关闭后 Toast 被污染
 */
// function showTip(message) {
//   const el = document.createElement('div')
//   el.textContent = message
//   el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.75);color:#fff;padding:10px 24px;border-radius:8px;font-size:14px;z-index:99999;text-align:center;max-width:70%;transition:opacity .3s;'
//   document.body.appendChild(el)
//   setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300) }, 2000)
// }

export function useMine() {
  const router = useRouter()
  const userStore = useUserStore()

  const empId = computed(() => userStore.empId)
  const empName = computed(() => userStore.empName)
  const avatar = computed(() => userStore.avatar)

  // 修改密码
  const showChangePwd = ref(false)
  const pwdLoading = ref(false)
  const showOldPwd = ref(false)
  const showNewPwd = ref(false)
  const showConfirmPwd = ref(false)
  const pwdForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // 退出登录确认弹窗（声明式，避免命令式调用污染遮罩层管理器）
  const showLogoutConfirm = ref(false)

  // 关于
  const showAbout = ref(false)

  function checkConfirmPwd(val) {
    return val === pwdForm.newPassword
  }

  function checkPasswordComplexity(val) {
    if (val.length < 6) return '密码不能少于6位'
    if (!/[a-zA-Z]/.test(val)) return '密码必须包含字母'
    if (!/[0-9]/.test(val)) return '密码必须包含数字'
    return true
  }

  async function onChangePwd() {
    pwdLoading.value = true
    try {
      await userStore.changePassword(empId.value, pwdForm.newPassword, pwdForm.oldPassword)
      showChangePwd.value = false
      pwdForm.oldPassword = ''
      pwdForm.newPassword = ''
      pwdForm.confirmPassword = ''
      showTip('密码修改成功，即将重新登录')
      userStore.logout()
      // 整页刷新，彻底销毁 Vue/Vant 实例和遮罩层状态
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      pwdLoading.value = false
    //   showChangePwd.value = false
      showTip(error.message || '修改失败')
    }
  }

  function onLogout() {
    showLogoutConfirm.value = true
  }

  async function onLogoutConfirm() {
    await userStore.logout()
    // 整页刷新，彻底销毁 Vue/Vant 实例和遮罩层状态
    // window.location.reload()
  }

  return {
    empId, empName, avatar,
    showChangePwd, pwdLoading, pwdForm,
    showOldPwd, showNewPwd, showConfirmPwd,
    showLogoutConfirm,
    showAbout,
    checkConfirmPwd,
    checkPasswordComplexity,
    onChangePwd,
    onLogout,
    onLogoutConfirm
  }
}
