<template>
  <div class="login-page">
    <div class="login-header">
      <div class="login-logo">
        <van-icon name="clock-o" size="48" color="#0d6ecc" />
      </div>
      <h1 class="login-title">项目工时申报</h1>
      <!-- <p class="login-subtitle">Project Timesheet Management</p> -->
    </div>

    <van-form @submit="onSubmit" class="login-form">
      <van-cell-group inset>
        <van-field
          v-model="formData.empId"
          name="empId"
          label="工号"
          placeholder="请输入工号"
          :rules="[{ required: true, message: '请输入工号' }]"
          left-icon="user-o"
          clearable
        />
        <van-field
          v-model="formData.password"
          :type="showPassword ? 'text' : 'password'"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :rules="[{ required: true, message: '请输入密码' }]"
          left-icon="lock"
          :right-icon="showPassword ? 'eye-o' : 'closed-eye'"
          @click-right-icon="showPassword = !showPassword"
        />
      </van-cell-group>

      <div class="login-remember">
        <van-checkbox v-model="remember" shape="square" icon-size="16px">
          记住工号和密码
        </van-checkbox>
      </div>

      <div class="login-actions">
        <van-button
          round
          block
          type="primary"
          native-type="submit"
          :loading="loading"
          loading-text="登录中..."
          class="login-btn"
        >
          登录
        </van-button>
      </div>
    </van-form>

    <!-- <div class="login-footer">
      <p>&copy; 2025 项目工时申报系统</p>
    </div> -->
  </div>
</template>

<script>
import { useLogin } from './LoginView.js'
export default {
  setup() {
    return useLogin()
  }
}
</script>

<style src="./LoginView.css"></style>
