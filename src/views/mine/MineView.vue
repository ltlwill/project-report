<template>
  <div class="mine-page">
    <!-- 用户信息区 -->
    <div class="mine-header">
      <div class="avatar-wrapper">
        <van-image
          v-if="avatar"
          :src="avatar"
          round
          width="64"
          height="64"
          fit="cover"
        />
        <div v-else class="avatar-default">
          <van-icon name="user-o" size="32" color="#fff" />
        </div>
      </div>
      <div class="user-meta">
        <h2 class="user-name">{{ empName }}</h2>
        <p class="user-empid">工号：{{ empId }}</p>
      </div>
    </div>

    <!-- 功能菜单 -->
    <van-cell-group inset class="mine-menu">
      <van-cell title="修改密码" is-link icon="lock" @click="showChangePwd = true" />
      <van-cell title="关于我们" is-link icon="info-o" @click="showAbout = true" />
    </van-cell-group>

    <!-- 退出登录 -->
    <div class="mine-logout">
      <van-button
        type="danger"
        block
        round
        plain
        @click="onLogout"
      >
        退出登录
      </van-button>
    </div>

    <!-- 修改密码弹窗（duration=0 禁用动画，避免遮罩层残留） -->
    <van-popup v-model:show="showChangePwd" round position="bottom" :duration="0" :style="{ maxHeight: '60%' }" teleport="body" :z-index="2000">
      <div class="pwd-popup">
        <div class="pwd-title">修改密码</div>
        <van-form @submit="onChangePwd" class="pwd-form">
          <van-field
            v-model="pwdForm.oldPassword"
            :type="showOldPwd ? 'text' : 'password'"
            label="旧密码"
            placeholder="请输入旧密码"
            :right-icon="showOldPwd ? 'eye-o' : 'closed-eye'"
            @click-right-icon="showOldPwd = !showOldPwd"
            :rules="[{ required: true, message: '请输入旧密码' }]"
          />
          <van-field
            v-model="pwdForm.newPassword"
            :type="showNewPwd ? 'text' : 'password'"
            label="新密码"
            placeholder="字母+数字，不少于6位"
            :right-icon="showNewPwd ? 'eye-o' : 'closed-eye'"
            @click-right-icon="showNewPwd = !showNewPwd"
            :rules="[
              { required: true, message: '请输入新密码' },
              { validator: checkPasswordComplexity }
            ]"
          />
          <div class="pwd-hint">密码必须由字母和数字组成，且不少于6位</div>
          <van-field
            v-model="pwdForm.confirmPassword"
            :type="showConfirmPwd ? 'text' : 'password'"
            label="确认密码"
            placeholder="请再次输入新密码"
            :right-icon="showConfirmPwd ? 'eye-o' : 'closed-eye'"
            @click-right-icon="showConfirmPwd = !showConfirmPwd"
            :rules="[
              { required: true, message: '请确认新密码' },
              { validator: checkConfirmPwd, message: '两次密码不一致' }
            ]"
          />
          <div class="pwd-actions">
            <van-button type="primary" block round native-type="submit" :loading="pwdLoading">
              确认修改
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 关于弹窗 -->
    <van-dialog
      v-model:show="showAbout"
      title="关于"
      :show-cancel-button="false"
      confirm-button-text="知道了"
    >
      <div class="about-content">
        <p>项目工时申报系统</p>
        <p>版本：v1.0.0</p>
        <p class="about-desc">用于项目工时的填报、记录与审批管理</p>
      </div>
    </van-dialog>
    <!-- 退出登录确认弹窗（声明式，避免命令式调用污染遮罩层管理器） -->
    <van-dialog
      v-model:show="showLogoutConfirm"
      title="提示"
      message="确定要退出登录吗？"
      show-cancel-button
      @confirm="onLogoutConfirm"
    />
  </div>
</template>

<script>
import { useMine } from './MineView.js'
export default {
  setup() {
    return useMine()
  }
}
</script>

<style src="./MineView.css"></style>
