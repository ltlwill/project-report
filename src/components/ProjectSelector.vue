<template>
  <van-popup
    v-model:show="showPopup"
    position="bottom"
    round
    :style="{ height: '70%' }"
    @close="onClose"
    teleport="body" 
    :z-index="2000"
  >
    <div class="project-selector">
      <div class="selector-header">
        <span class="selector-title">选择项目</span>
        <van-icon name="cross" @click="onClose" class="selector-close" />
      </div>

      <van-search
        v-model="keyword"
        placeholder="搜索项目编号、名称、型号"
        shape="round"
        @search="onSearch"
        @update:model-value="onSearch"
        class="selector-search"
      />

      <div class="selector-list">
        <van-loading v-if="loading" class="selector-loading" />
        <van-empty v-else-if="projectList.length === 0" description="未找到相关项目" image="search" />
        <div v-else class="project-items">
          <div
            v-for="item in projectList"
            :key="item.projectId"
            class="project-item"
          >
            <div class="project-info">
              <!-- <div class="project-no">{{ item.specModel }}</div> -->
              <!-- <div class="project-no">{{ item.plmCode }}</div> -->
              <div class="project-name">{{ item.projectName }}</div>
            </div>
            <van-button
              v-if="isAdded(item.projectId)"
              size="small"
              disabled
              plain
              type="default"
            >
              已添加
            </van-button>
            <van-button
              v-else
              icon="add-o"
              size="small"
              type="primary"
              plain
              @click="onAdd(item)"
            >
              添加
            </van-button>
          </div>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script>
import { useProjectSelector } from './ProjectSelector.js'
export default {
  props: {
    modelValue: { type: Boolean, default: false },
    reportDate: { type: String, default: '' }
  },
  emits: ['update:modelValue', 'add'],
  setup(props, { emit }) {
    return useProjectSelector(props, emit)
  }
}
</script>

<style src="./ProjectSelector.css"></style>
