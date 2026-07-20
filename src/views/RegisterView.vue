<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Lock, Message, Right, User, UserFilled } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import type { RegisterRequest } from '@/types/auth'
import { getApiErrorMessage, getFieldErrors } from '@/utils/api-error'

const authStore = useAuthStore()
const router = useRouter()
const formRef = ref<FormInstance>()
const isSubmitting = ref(false)

const form = reactive<RegisterRequest>({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const serverErrors = reactive<Record<keyof RegisterRequest, string>>({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const rules: FormRules<RegisterRequest> = {
  name: [
    { required: true, message: 'Name is required.', trigger: 'blur' },
    { max: 150, message: 'Use no more than 150 characters.', trigger: 'blur' },
  ],
  email: [
    { required: true, message: 'Email is required.', trigger: 'blur' },
    { type: 'email', message: 'Enter a valid email address.', trigger: 'blur' },
    { max: 255, message: 'Use no more than 255 characters.', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'Password is required.', trigger: 'blur' },
    { min: 8, max: 72, message: 'Use between 8 and 72 characters.', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        const isStrong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/.test(value)
        callback(
          isStrong
            ? undefined
            : new Error('Use uppercase, lowercase, number, and special characters.'),
        )
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: 'Please confirm your password.', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        callback(value === form.password ? undefined : new Error('The passwords do not match.'))
      },
      trigger: ['blur', 'change'],
    },
  ],
}

const clearServerErrors = (): void => {
  Object.keys(serverErrors).forEach((field) => {
    serverErrors[field as keyof RegisterRequest] = ''
  })
}

const submit = async (): Promise<void> => {
  if (!formRef.value) return

  clearServerErrors()
  const isValid = await formRef.value.validate().catch(() => false)
  if (!isValid) return

  isSubmitting.value = true

  try {
    await authStore.registerAndLogin(form)
    ElMessage.success('Your account is ready!')
    await router.replace('/')
  } catch (error) {
    const fieldErrors = getFieldErrors(error)
    serverErrors.name = fieldErrors.name ?? ''
    serverErrors.email = fieldErrors.email ?? ''
    serverErrors.password = fieldErrors.password ?? ''
    serverErrors.confirmPassword = fieldErrors.confirmPassword ?? ''
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
        <p class="eyebrow">A home for every belonging</p>
        <h1>Start organized.<br />Stay organized.</h1>
        <p>
          Build a searchable record of the things that matter, from everyday essentials to valuable
          keepsakes.
        </p>
      </div>
    </section>

    <section class="auth-content auth-content--register">
      <el-card class="auth-card" shadow="never">
        <header class="auth-card__header">
          <h2>Create your account</h2>
        </header>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          @submit.prevent="submit"
        >
          <el-form-item label="Full name" prop="name" :error="serverErrors.name">
            <el-input
              v-model.trim="form.name"
              :prefix-icon="User"
              autocomplete="name"
              placeholder="Your full name"
              maxlength="150"
              @input="serverErrors.name = ''"
            />
          </el-form-item>

          <el-form-item label="Email" prop="email" :error="serverErrors.email">
            <el-input
              v-model.trim="form.email"
              :prefix-icon="Message"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              maxlength="255"
              @input="serverErrors.email = ''"
            />
          </el-form-item>

          <el-form-item label="Password" prop="password" :error="serverErrors.password">
            <el-input
              v-model="form.password"
              :prefix-icon="Lock"
              type="password"
              autocomplete="new-password"
              placeholder="Create a strong password"
              maxlength="72"
              show-password
              @input="serverErrors.password = ''"
            />
            <p class="field-hint">8–72 characters with uppercase, lowercase, number, and symbol.</p>
          </el-form-item>

          <el-form-item
            label="Confirm password"
            prop="confirmPassword"
            :error="serverErrors.confirmPassword"
          >
            <el-input
              v-model="form.confirmPassword"
              :prefix-icon="Lock"
              type="password"
              autocomplete="new-password"
              placeholder="Repeat your password"
              maxlength="72"
              show-password
              @input="serverErrors.confirmPassword = ''"
            />
          </el-form-item>

          <el-button
            class="auth-submit"
            type="primary"
            native-type="submit"
            :loading="isSubmitting"
          >
            Create account
            <el-icon class="el-icon--right"><Right /></el-icon>
          </el-button>
        </el-form>

        <el-divider>Already have an account?</el-divider>

        <p class="auth-switch">
          Return to your inventory.
          <el-link type="primary" :underline="false" @click="router.push('/login')">
            Sign in
          </el-link>
        </p>
      </el-card>
    </section>
  </main>
</template>
