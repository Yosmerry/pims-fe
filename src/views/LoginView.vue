<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Lock, Message, Right, UserFilled } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import type { LoginRequest } from '@/types/auth'
import { getApiErrorMessage, getFieldErrors } from '@/utils/api-error'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const formRef = ref<FormInstance>()
const isSubmitting = ref(false)

const form = reactive<LoginRequest>({
  email: '',
  password: '',
})

const serverErrors = reactive<Record<keyof LoginRequest, string>>({
  email: '',
  password: '',
})

const rules: FormRules<LoginRequest> = {
  email: [
    { required: true, message: 'Email is required.', trigger: 'blur' },
    { type: 'email', message: 'Enter a valid email address.', trigger: 'blur' },
  ],
  password: [{ required: true, message: 'Password is required.', trigger: 'blur' }],
}

const clearServerErrors = (): void => {
  serverErrors.email = ''
  serverErrors.password = ''
}

const submit = async (): Promise<void> => {
  if (!formRef.value) return

  clearServerErrors()
  const isValid = await formRef.value.validate().catch(() => false)
  if (!isValid) return

  isSubmitting.value = true

  try {
    await authStore.login(form)
    ElMessage.success('Welcome back!')

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (error) {
    const fieldErrors = getFieldErrors(error)
    serverErrors.email = fieldErrors.email ?? ''
    serverErrors.password = fieldErrors.password ?? ''
    ElMessage.error(getApiErrorMessage(error))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-brand" aria-label="PIMS introduction">
      <div class="brand-orb brand-orb--sage" />
      <div class="brand-orb brand-orb--blush" />

      <div class="brand-mark">
        <el-icon :size="24"><UserFilled /></el-icon>
        <span>PIMS</span>
      </div>

      <div class="brand-copy">
        <p class="eyebrow">Personal inventory, simplified</p>
        <h1>Know what you own.<br />Find it when you need it.</h1>
        <p>
          Keep your belongings, categories, locations, and photos organized in one private
          workspace.
        </p>
      </div>
    </section>

    <section class="auth-content">
      <el-card class="auth-card" shadow="never">
        <header class="auth-card__header">
          <p class="eyebrow">Welcome back</p>
          <h2>Sign in to your account</h2>
          <p>Enter your details to continue to your inventory.</p>
        </header>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          @submit.prevent="submit"
        >
          <el-form-item label="Email" prop="email" :error="serverErrors.email">
            <el-input
              v-model.trim="form.email"
              :prefix-icon="Message"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              @input="serverErrors.email = ''"
            />
          </el-form-item>

          <el-form-item label="Password" prop="password" :error="serverErrors.password">
            <el-input
              v-model="form.password"
              :prefix-icon="Lock"
              type="password"
              autocomplete="current-password"
              placeholder="Enter your password"
              show-password
              @input="serverErrors.password = ''"
            />
          </el-form-item>

          <el-button
            class="auth-submit"
            type="primary"
            native-type="submit"
            :loading="isSubmitting"
          >
            Sign in
            <el-icon class="el-icon--right"><Right /></el-icon>
          </el-button>
        </el-form>

        <el-divider>New to PIMS?</el-divider>

        <p class="auth-switch">
          Create your personal inventory in minutes.
          <el-link type="primary" :underline="false" @click="router.push('/register')">
            Create account
          </el-link>
        </p>
      </el-card>
    </section>
  </main>
</template>
