<script setup lang="ts">
import { Box, SwitchButton } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const logout = async (): Promise<void> => {
  try {
    await authStore.logout()
  } catch {
    ElMessage.warning('You were signed out locally, but the server could not be reached.')
  } finally {
    await router.replace('/login')
  }
}
</script>

<template>
  <main class="home-page">
    <el-container class="home-shell">
      <el-header class="home-header">
        <div class="brand-mark brand-mark--dark">
          <el-icon :size="24"><Box /></el-icon>
          <span>PIMS</span>
        </div>

        <el-button :icon="SwitchButton" plain @click="logout">Sign out</el-button>
      </el-header>

      <el-main class="home-main">
        <el-card class="welcome-card" shadow="never">
          <el-tag effect="plain">Home preview</el-tag>
          <h1>Welcome{{ authStore.user?.name ? `, ${authStore.user.name}` : '' }}.</h1>
          <p>
            Authentication is connected. Your inventory dashboard will be built here in the next
            feature.
          </p>
          <el-empty description="No inventory items to show yet" />
        </el-card>
      </el-main>
    </el-container>
  </main>
</template>
