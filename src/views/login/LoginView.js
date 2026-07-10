import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/store/modules/user.js'
import { showTip } from '@/utils/tip.js'

export function useLogin() {
  const router = useRouter()
  const route = useRoute()
  const userStore = useUserStore()

  const loading = ref(false)
  const remember = ref(false)
  const showPassword = ref(false)

  const formData = reactive({
    empId: '',
    password: ''
  })

  onMounted(() => {
    // 读取记住的账号密码
    const remembered = userStore.getRemembered()
    if (remembered) {
      formData.empId = remembered.empId || ''
      formData.password = remembered.password || ''
      remember.value = true
    }
  })

  async function onSubmit() {
    if (!formData.empId || !formData.password) {
      // showToast('请输入工号和密码')
      showTip('请输入工号和密码')
      return
    }

    loading.value = true
    try {
      await userStore.login(formData.empId, formData.password, remember.value)
      // showToast({ message: '登录成功', type: 'success' })
      showTip('登录成功')

      setTimeout(() => {
        // 跳转到重定向地址或首页
        const redirect = route.query.redirect || '/'
        router.replace(redirect)
      }, 500);
    } catch (error) {
      // showToast(error.message || '登录失败，请检查工号和密码')
      showTip(error.message || '登录失败，请检查工号和密码')
    } finally {
      loading.value = false
    }
  }

  return {
    formData,
    remember,
    loading,
    showPassword,
    onSubmit
  }
}
