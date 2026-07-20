<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { Delete, Edit, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

import { categoryApi } from '@/api/category.api'
import type {
  Category,
  CategoryStatus,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/types/category'
import type { PageResponse } from '@/types/pagination'
import { getApiErrorMessage, getFieldErrors } from '@/utils/api-error'
import { formatDateTime, formatLabel } from '@/utils/format'

interface CategoryFormModel {
  name: string
  description: string
  status: CategoryStatus
}

const isLoading = ref(false)
const isSubmitting = ref(false)
const dialogVisible = ref(false)
const editingCategory = ref<Category | null>(null)
const formRef = ref<FormInstance>()

const result = reactive<PageResponse<Category>>({
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
})

const form = reactive<CategoryFormModel>({
  name: '',
  description: '',
  status: 'ACTIVE',
})

const serverErrors = reactive({
  name: '',
  description: '',
  status: '',
})

const rules: FormRules<CategoryFormModel> = {
  name: [
    { required: true, message: 'Category name is required.', trigger: 'blur' },
    { max: 100, message: 'Use no more than 100 characters.', trigger: 'blur' },
  ],
  description: [{ max: 500, message: 'Use no more than 500 characters.', trigger: 'blur' }],
  status: [{ required: true, message: 'Status is required.', trigger: 'change' }],
}

const clearServerErrors = (): void => {
  serverErrors.name = ''
  serverErrors.description = ''
  serverErrors.status = ''
}

const loadCategories = async (): Promise<void> => {
  isLoading.value = true

  try {
    const response = await categoryApi.findAll(result.page, result.size)
    Object.assign(result, response)
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

const resetFormValidation = (): void => {
  clearServerErrors()
  void nextTick(() => formRef.value?.clearValidate())
}

const openCreateDialog = (): void => {
  editingCategory.value = null
  form.name = ''
  form.description = ''
  form.status = 'ACTIVE'
  dialogVisible.value = true
  resetFormValidation()
}

const openEditDialog = (category: Category): void => {
  editingCategory.value = category
  form.name = category.name
  form.description = category.description ?? ''
  form.status = category.status
  dialogVisible.value = true
  resetFormValidation()
}

const nullableDescription = (): string | null => form.description.trim() || null

const submit = async (): Promise<void> => {
  if (!formRef.value) return

  clearServerErrors()
  const isValid = await formRef.value.validate().catch(() => false)
  if (!isValid) return

  isSubmitting.value = true

  try {
    if (editingCategory.value) {
      const request: UpdateCategoryRequest = {
        name: form.name.trim(),
        description: nullableDescription(),
        status: form.status,
      }
      await categoryApi.update(editingCategory.value.code, request)
      ElMessage.success('Category updated.')
    } else {
      const request: CreateCategoryRequest = {
        name: form.name.trim(),
        description: nullableDescription(),
      }
      await categoryApi.create(request)
      result.page = 0
      ElMessage.success('Category created.')
    }

    dialogVisible.value = false
    await loadCategories()
  } catch (error) {
    const fieldErrors = getFieldErrors(error)
    serverErrors.name = fieldErrors.name ?? ''
    serverErrors.description = fieldErrors.description ?? ''
    serverErrors.status = fieldErrors.status ?? ''
    ElMessage.error(getApiErrorMessage(error))
  } finally {
    isSubmitting.value = false
  }
}

const deleteCategory = async (category: Category): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      `Delete “${category.name}”? This category will no longer be available for new inventory items.`,
      'Delete category',
      {
        type: 'warning',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        confirmButtonClass: 'el-button--danger',
      },
    )
    await categoryApi.delete(category.code)
    ElMessage.success('Category deleted.')

    if (result.content.length === 1 && result.page > 0) {
      result.page -= 1
    }
    await loadCategories()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(getApiErrorMessage(error))
    }
  }
}

const changePage = (page: number): void => {
  result.page = page - 1
  void loadCategories()
}

const changePageSize = (size: number): void => {
  result.size = size
  result.page = 0
  void loadCategories()
}

onMounted(loadCategories)
</script>

<template>
  <section class="inventory-page category-page">
    <el-breadcrumb separator="/" class="page-breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">Home</el-breadcrumb-item>
      <el-breadcrumb-item>Categories</el-breadcrumb-item>
    </el-breadcrumb>

    <header class="page-heading">
      <div>
        <p class="eyebrow">Inventory organization</p>
        <h1>Categories</h1>
        <p>Group similar belongings so they are easier to find.</p>
      </div>

      <el-button type="primary" :icon="Plus" size="large" @click="openCreateDialog">
        Add category
      </el-button>
    </header>

    <el-card class="inventory-table-card category-table-card" shadow="never">
      <template #header>
        <div class="table-card-heading">
          <div>
            <h2>Category list</h2>
            <p>
              {{ result.totalElements }}
              {{ result.totalElements === 1 ? 'category' : 'categories' }}
            </p>
          </div>
          <el-button
            :icon="Refresh"
            circle
            aria-label="Refresh categories"
            @click="loadCategories"
          />
        </div>
      </template>

      <div class="inventory-table-wrap">
        <el-table v-loading="isLoading" :data="result.content" empty-text="No categories found">
          <el-table-column label="Category" min-width="220">
            <template #default="{ row }: { row: Category }">
              <div class="reference-name-cell">
                <span>{{ row.name }}</span>
                <small>{{ row.code }}</small>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="description" label="Description" min-width="320">
            <template #default="{ row }: { row: Category }">
              <span class="reference-description">{{ row.description || '—' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Status" width="120">
            <template #default="{ row }: { row: Category }">
              <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'" effect="light" round>
                {{ formatLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Updated" min-width="170">
            <template #default="{ row }: { row: Category }">
              {{ formatDateTime(row.updatedDate) }}
            </template>
          </el-table-column>

          <el-table-column label="Actions" width="110" fixed="right">
            <template #default="{ row }: { row: Category }">
              <div class="table-actions">
                <el-tooltip content="Edit category">
                  <el-button :icon="Edit" circle @click="openEditDialog(row)" />
                </el-tooltip>
                <el-tooltip content="Delete category">
                  <el-button
                    :icon="Delete"
                    circle
                    type="danger"
                    plain
                    @click="deleteCategory(row)"
                  />
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="result.totalElements" class="pagination-row">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :current-page="result.page + 1"
          :page-size="result.size"
          :page-sizes="[10, 20, 50]"
          :total="result.totalElements"
          @current-change="changePage"
          @size-change="changePageSize"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingCategory ? 'Edit category' : 'Add category'"
      width="min(92vw, 540px)"
      destroy-on-close
      align-center
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        @submit.prevent="submit"
      >
        <el-form-item label="Name" prop="name" :error="serverErrors.name">
          <el-input
            v-model.trim="form.name"
            maxlength="100"
            show-word-limit
            placeholder="e.g. Electronics"
            @input="serverErrors.name = ''"
          />
        </el-form-item>

        <el-form-item
          label="Description (optional)"
          prop="description"
          :error="serverErrors.description"
        >
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="Describe the items that belong to this category"
            @input="serverErrors.description = ''"
          />
        </el-form-item>

        <el-form-item
          v-if="editingCategory"
          label="Status"
          prop="status"
          :error="serverErrors.status"
        >
          <el-radio-group v-model="form.status" @change="serverErrors.status = ''">
            <el-radio-button value="ACTIVE">Active</el-radio-button>
            <el-radio-button value="INACTIVE">Inactive</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <button class="hidden-submit" type="submit" tabindex="-1" aria-hidden="true" />
      </el-form>

      <template #footer>
        <el-button size="large" @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" size="large" :loading="isSubmitting" @click="submit">
          {{ editingCategory ? 'Save changes' : 'Create category' }}
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>
