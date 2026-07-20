<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ArrowLeft, Picture, Plus, UploadFilled } from '@element-plus/icons-vue'
import {
  ElMessage,
  type FormInstance,
  type FormRules,
  type UploadFile,
  type UploadFiles,
  type UploadUserFile,
} from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import { imageApi } from '@/api/image.api'
import { inventoryApi } from '@/api/inventory.api'
import { referenceApi } from '@/api/reference.api'
import { MAX_IMAGES_PER_ITEM } from '@/constants/image'
import {
  INVENTORY_CONDITIONS,
  INVENTORY_STATUSES,
  type CreateInventoryItemRequest,
  type InventoryCondition,
  type InventoryStatus,
  type UpdateInventoryItemRequest,
} from '@/types/inventory'
import type { ReferenceItem } from '@/types/reference'
import { getApiErrorMessage, getFieldErrors } from '@/utils/api-error'
import { formatLabel } from '@/utils/format'

interface InventoryFormModel {
  categoryCode: string
  locationCode: string
  name: string
  description: string
  quantity: number
  purchasePrice: number | null
  purchaseDate: string
  condition: InventoryCondition | ''
  status: InventoryStatus
  notes: string
}

const route = useRoute()
const router = useRouter()
const formRef = ref<FormInstance>()
const isLoading = ref(false)
const isSubmitting = ref(false)
const categories = ref<ReferenceItem[]>([])
const locations = ref<ReferenceItem[]>([])
const imageFiles = ref<UploadUserFile[]>([])
const selectedImage = ref<File | null>(null)
const existingImageCount = ref(0)

const isEdit = computed(() => route.name === 'inventory-edit')
const itemCode = computed(() => (isEdit.value ? String(route.params.code) : null))
const cancelPath = computed(() => (itemCode.value ? `/inventory/${itemCode.value}` : '/inventory'))
const hasReachedImageLimit = computed(() => existingImageCount.value >= MAX_IMAGES_PER_ITEM)

const form = reactive<InventoryFormModel>({
  categoryCode: '',
  locationCode: '',
  name: '',
  description: '',
  quantity: 1,
  purchasePrice: null,
  purchaseDate: '',
  condition: '',
  status: 'OWNED',
  notes: '',
})

const serverErrors = reactive<Record<keyof InventoryFormModel | 'file', string>>({
  categoryCode: '',
  locationCode: '',
  name: '',
  description: '',
  quantity: '',
  purchasePrice: '',
  purchaseDate: '',
  condition: '',
  status: '',
  notes: '',
  file: '',
})

const rules: FormRules<InventoryFormModel> = {
  categoryCode: [{ required: true, message: 'Category is required.', trigger: 'change' }],
  name: [
    { required: true, message: 'Item name is required.', trigger: 'blur' },
    { max: 150, message: 'Use no more than 150 characters.', trigger: 'blur' },
  ],
  description: [{ max: 1000, message: 'Use no more than 1,000 characters.', trigger: 'blur' }],
  quantity: [
    { required: true, message: 'Quantity is required.', trigger: 'change' },
    { type: 'number', min: 1, message: 'Quantity must be at least 1.', trigger: 'change' },
  ],
  purchasePrice: [
    { type: 'number', min: 0, message: 'Purchase price cannot be negative.', trigger: 'change' },
  ],
  condition: [{ required: true, message: 'Condition is required.', trigger: 'change' }],
  status: [{ required: true, message: 'Status is required.', trigger: 'change' }],
  notes: [{ max: 1000, message: 'Use no more than 1,000 characters.', trigger: 'blur' }],
}

const clearServerErrors = (): void => {
  Object.keys(serverErrors).forEach((field) => {
    serverErrors[field as keyof typeof serverErrors] = ''
  })
}

const loadPage = async (): Promise<void> => {
  isLoading.value = true

  try {
    const [categoryResult, locationResult] = await Promise.all([
      referenceApi.findCategories(),
      referenceApi.findLocations(),
    ])
    categories.value = categoryResult
    locations.value = locationResult

    if (itemCode.value) {
      const [item, images] = await Promise.all([
        inventoryApi.findByCode(itemCode.value),
        imageApi.findAll(itemCode.value),
      ])
      existingImageCount.value = images.length
      form.categoryCode = item.categoryCode
      form.locationCode = item.locationCode ?? ''
      form.name = item.name
      form.description = item.description ?? ''
      form.quantity = item.quantity
      form.purchasePrice = item.purchasePrice
      form.purchaseDate = item.purchaseDate ?? ''
      form.condition = item.condition
      form.status = item.status
      form.notes = item.notes ?? ''
    }
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

const disabledFutureDate = (date: Date): boolean => date.getTime() > Date.now()

const handleImageChange = (uploadFile: UploadFile, uploadFiles: UploadFiles): void => {
  const file = uploadFile.raw
  if (!file) return

  if (hasReachedImageLimit.value) {
    selectedImage.value = null
    imageFiles.value = []
    serverErrors.file = `Maximum of ${MAX_IMAGES_PER_ITEM} images per inventory item.`
    return
  }

  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    selectedImage.value = null
    imageFiles.value = []
    serverErrors.file = 'Only JPEG and PNG images are supported.'
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    selectedImage.value = null
    imageFiles.value = []
    serverErrors.file = 'The image must be 5 MB or smaller.'
    return
  }

  selectedImage.value = file
  imageFiles.value = uploadFiles.slice(-1)
  serverErrors.file = ''
}

const handleImageRemove = (): void => {
  selectedImage.value = null
  imageFiles.value = []
  serverErrors.file = ''
}

const nullableText = (value: string): string | null => value.trim() || null

const createRequest = (): CreateInventoryItemRequest => ({
  categoryCode: form.categoryCode,
  locationCode: form.locationCode || null,
  name: form.name.trim(),
  description: nullableText(form.description),
  quantity: form.quantity,
  purchasePrice: form.purchasePrice,
  purchaseDate: form.purchaseDate || null,
  condition: form.condition as InventoryCondition,
  notes: nullableText(form.notes),
})

const applyServerErrors = (error: unknown): void => {
  const fieldErrors = getFieldErrors(error)
  Object.keys(serverErrors).forEach((field) => {
    serverErrors[field as keyof typeof serverErrors] = fieldErrors[field] ?? ''
  })
}

const submit = async (): Promise<void> => {
  if (!formRef.value) return

  clearServerErrors()
  const isValid = await formRef.value.validate().catch(() => false)
  if (!isValid) return

  if (selectedImage.value && hasReachedImageLimit.value) {
    serverErrors.file = `Maximum of ${MAX_IMAGES_PER_ITEM} images per inventory item.`
    return
  }

  isSubmitting.value = true

  try {
    const savedItem = isEdit.value
      ? await inventoryApi.update(itemCode.value as string, {
          ...createRequest(),
          status: form.status,
        } satisfies UpdateInventoryItemRequest)
      : await inventoryApi.create(createRequest())

    if (selectedImage.value) {
      try {
        await imageApi.upload(savedItem.code, selectedImage.value)
      } catch (imageError) {
        ElMessage.warning(`Item saved, but ${getApiErrorMessage(imageError).toLowerCase()}`)
        await router.replace(`/inventory/${savedItem.code}`)
        return
      }
    }

    ElMessage.success(isEdit.value ? 'Inventory item updated.' : 'Inventory item created.')
    await router.replace(`/inventory/${savedItem.code}`)
  } catch (error) {
    applyServerErrors(error)
    ElMessage.error(getApiErrorMessage(error))
  } finally {
    isSubmitting.value = false
  }
}

onMounted(loadPage)
</script>

<template>
  <section v-loading="isLoading" class="app-page form-page">
    <el-breadcrumb separator="/" class="page-breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">Home</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/inventory' }">Inventory</el-breadcrumb-item>
      <el-breadcrumb-item>{{ isEdit ? 'Edit' : 'Add item' }}</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="form-page__heading">
      <el-button :icon="ArrowLeft" text @click="router.push(cancelPath)">Back</el-button>
    </div>

    <el-card class="app-card inventory-form-card" shadow="never">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        @submit.prevent="submit"
      >
        <section class="form-section">
          <div class="form-section__heading">
            <span>1</span>
            <div>
              <h2>Basic information</h2>
              <p>Name and organize your item.</p>
            </div>
          </div>

          <div class="inventory-form-grid">
            <el-form-item label="Item name" prop="name" :error="serverErrors.name">
              <el-input
                v-model.trim="form.name"
                maxlength="150"
                placeholder="e.g. MacBook Pro"
                @input="serverErrors.name = ''"
              />
            </el-form-item>

            <el-form-item label="Category" prop="categoryCode" :error="serverErrors.categoryCode">
              <el-select
                v-model="form.categoryCode"
                filterable
                placeholder="Select category"
                @change="serverErrors.categoryCode = ''"
              >
                <el-option
                  v-for="category in categories"
                  :key="category.code"
                  :label="category.name"
                  :value="category.code"
                />
              </el-select>
            </el-form-item>

            <el-form-item
              label="Location (optional)"
              prop="locationCode"
              :error="serverErrors.locationCode"
            >
              <el-select
                v-model="form.locationCode"
                clearable
                filterable
                placeholder="Select location"
                @change="serverErrors.locationCode = ''"
              >
                <el-option
                  v-for="location in locations"
                  :key="location.code"
                  :label="location.name"
                  :value="location.code"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="Quantity" prop="quantity" :error="serverErrors.quantity">
              <el-input-number
                v-model="form.quantity"
                :min="1"
                controls-position="right"
                @change="serverErrors.quantity = ''"
              />
            </el-form-item>

            <el-form-item
              class="form-span-2"
              label="Description (optional)"
              prop="description"
              :error="serverErrors.description"
            >
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                maxlength="1000"
                show-word-limit
                placeholder="Describe this item"
                @input="serverErrors.description = ''"
              />
            </el-form-item>
          </div>
        </section>

        <el-divider />

        <section class="form-section">
          <div class="form-section__heading">
            <span>2</span>
            <div>
              <h2>Condition and purchase</h2>
              <p>Record its condition and purchase information.</p>
            </div>
          </div>

          <div class="inventory-form-grid">
            <el-form-item label="Condition" prop="condition" :error="serverErrors.condition">
              <el-select
                v-model="form.condition"
                placeholder="Select condition"
                @change="serverErrors.condition = ''"
              >
                <el-option
                  v-for="condition in INVENTORY_CONDITIONS"
                  :key="condition"
                  :label="formatLabel(condition)"
                  :value="condition"
                />
              </el-select>
            </el-form-item>

            <el-form-item v-if="isEdit" label="Status" prop="status" :error="serverErrors.status">
              <el-select v-model="form.status" @change="serverErrors.status = ''">
                <el-option
                  v-for="status in INVENTORY_STATUSES"
                  :key="status"
                  :label="formatLabel(status)"
                  :value="status"
                />
              </el-select>
            </el-form-item>

            <el-form-item
              label="Purchase price (IDR)"
              prop="purchasePrice"
              :error="serverErrors.purchasePrice"
            >
              <el-input-number
                v-model="form.purchasePrice"
                :min="0"
                :precision="2"
                :step="10000"
                controls-position="right"
                placeholder="0.00"
                @change="serverErrors.purchasePrice = ''"
              />
            </el-form-item>

            <el-form-item
              label="Purchase date"
              prop="purchaseDate"
              :error="serverErrors.purchaseDate"
            >
              <el-date-picker
                v-model="form.purchaseDate"
                type="date"
                value-format="YYYY-MM-DD"
                format="DD MMM YYYY"
                :disabled-date="disabledFutureDate"
                placeholder="Select purchase date"
                @change="serverErrors.purchaseDate = ''"
              />
            </el-form-item>

            <el-form-item
              class="form-span-2"
              label="Notes (optional)"
              prop="notes"
              :error="serverErrors.notes"
            >
              <el-input
                v-model="form.notes"
                type="textarea"
                :rows="3"
                maxlength="1000"
                show-word-limit
                placeholder="Warranty, serial number, or anything else to remember"
                @input="serverErrors.notes = ''"
              />
            </el-form-item>
          </div>
        </section>

        <el-divider />

        <section class="form-section">
          <div class="form-section__heading">
            <span>3</span>
            <div>
              <h2>Image</h2>
              <p>
                Add one optional JPEG or PNG image, up to 5 MB. Maximum
                {{ MAX_IMAGES_PER_ITEM }} images per item.
              </p>
            </div>
          </div>

          <el-alert
            v-if="hasReachedImageLimit"
            :title="`Maximum of ${MAX_IMAGES_PER_ITEM} images reached`"
            description="Delete an existing image from the inventory detail page before uploading another."
            type="warning"
            show-icon
            :closable="false"
          />

          <el-form-item v-else :error="serverErrors.file" class="image-upload-item">
            <el-upload
              v-model:file-list="imageFiles"
              drag
              action="#"
              accept="image/jpeg,image/png"
              :auto-upload="false"
              :limit="1"
              :on-change="handleImageChange"
              :on-remove="handleImageRemove"
              :on-exceed="() => ElMessage.warning('Only one image can be uploaded at a time.')"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">Drop an image here or <em>browse</em></div>
              <template #tip>
                <div class="el-upload__tip">
                  <el-icon><Picture /></el-icon>
                  {{ existingImageCount }} / {{ MAX_IMAGES_PER_ITEM }} images currently uploaded.
                  The first uploaded image becomes primary.
                </div>
              </template>
            </el-upload>
          </el-form-item>
        </section>

        <footer class="inventory-form-actions">
          <el-button size="large" @click="router.push(cancelPath)">Cancel</el-button>
          <el-button
            type="primary"
            size="large"
            native-type="submit"
            :icon="Plus"
            :loading="isSubmitting"
          >
            {{ isEdit ? 'Save changes' : 'Create item' }}
          </el-button>
        </footer>
      </el-form>
    </el-card>
  </section>
</template>
