<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowDown, Box, Expand, Fold, Goods, SwitchButton } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const isCollapsed = ref(true)
const drawerOpen = ref(false)

const initials = computed(() => {
  const name = authStore.user?.name?.trim()
  if (!name) return 'PI'

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
})

const toggleNavigation = (): void => {
  if (window.matchMedia('(max-width: 760px)').matches) {
    drawerOpen.value = true
    return
  }

  isCollapsed.value = !isCollapsed.value
}

const navigateFromDrawer = (path: string): void => {
  drawerOpen.value = false
  void router.push(path)
}

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
  <el-container class="app-shell">
    <el-header class="app-header">
      <div class="app-header__left">
        <el-button
          class="nav-toggle"
          :icon="isCollapsed ? Expand : Fold"
          text
          aria-label="Toggle navigation"
          @click="toggleNavigation"
        />

        <div class="brand-mark brand-mark--dark">
          <el-icon :size="23"><Box /></el-icon>
          <span>PIMS</span>
        </div>
      </div>

      <div class="app-header__right">
        <el-dropdown trigger="click" @command="logout">
          <button class="profile-menu" type="button">
            <el-avatar :size="36">{{ initials }}</el-avatar>
            <span class="profile-menu__name">{{ authStore.user?.name ?? 'PIMS User' }}</span>
            <el-icon><ArrowDown /></el-icon>
          </button>

          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :icon="SwitchButton" command="logout">Sign out</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container class="app-body">
      <el-aside width="232px" class="app-sidebar" :class="{ 'app-sidebar--hidden': isCollapsed }">
        <el-menu :default-active="route.path" :collapse="isCollapsed" router>
          <el-menu-item index="/inventory">
            <el-icon><Goods /></el-icon>
            <template #title>Inventory</template>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="app-main">
        <RouterView />
      </el-main>
    </el-container>

    <el-drawer v-model="drawerOpen" direction="ltr" size="280px" :with-header="false">
      <div class="drawer-brand">
        <div class="brand-mark brand-mark--dark">
          <el-icon :size="23"><Box /></el-icon>
          <span>PIMS</span>
        </div>
      </div>

      <el-menu :default-active="route.path" router>
        <el-menu-item index="/inventory" @click="navigateFromDrawer('/inventory')">
          <el-icon><Goods /></el-icon>
          <template #title>Inventory</template>
        </el-menu-item>
      </el-menu>
    </el-drawer>
  </el-container>
</template>
