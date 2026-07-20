<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  ArrowLeft,
  Calendar,
  CollectionTag,
  Delete,
  Edit,
  Location,
  Money,
  Picture,
  Tickets,
  Upload,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import { imageApi } from '@/api/image.api'
import { inventoryApi } from '@/api/inventory.api'
import { referenceApi } from '@/api/reference.api'
import { MAX_IMAGES_PER_ITEM } from '@/constants/image'
import type { InventoryImage } from '@/types/image'
import type { InventoryItem, InventoryStatus } from '@/types/inventory'
import { getApiErrorMessage } from '@/utils/api-error'
import { formatCurrency, formatDate, formatDateTime, formatLabel } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const isLoading = ref(true)
const item = ref<InventoryItem | null>(null)
const categoryName = ref('—')
const locationName = ref('—')
const isGalleryLoading = ref(false)
const deletingImageCode = ref<string | null>(null)

interface GalleryImage extends InventoryImage {
  objectUrl: string
}

const galleryImages = ref<GalleryImage[]>([])

const code = computed(() => String(route.params.code))
const statusTagTypes: Record<InventoryStatus, 'success' | 'warning' | 'info' | 'danger'> = {
  OWNED: 'success',
  LOANED: 'warning',
  SOLD: 'info',
  LOST: 'danger',
  DISPOSED: 'info',
}
const previewUrls = computed(() => galleryImages.value.map((image) => image.objectUrl))
const canAddImage = computed(() => galleryImages.value.length < MAX_IMAGES_PER_ITEM)

const clearGalleryImages = (): void => {
  galleryImages.value.forEach((image) => URL.revokeObjectURL(image.objectUrl))
  galleryImages.value = []
}

const replaceGalleryImages = (images: GalleryImage[]): void => {
  clearGalleryImages()
  galleryImages.value = images
}

const loadImages = async (): Promise<void> => {
  isGalleryLoading.value = true

  try {
    const imageMetadata = await imageApi.findAll(code.value)
    const imageBlobs = await Promise.all(
      imageMetadata.map((image) => imageApi.findContent(image.code)),
    )
    const images = imageMetadata.map((image, index) => ({
      ...image,
      objectUrl: URL.createObjectURL(imageBlobs[index] as Blob),
    }))
    replaceGalleryImages(images)
  } catch (error) {
    ElMessage.warning(`Images could not be loaded: ${getApiErrorMessage(error)}`)
  } finally {
    isGalleryLoading.value = false
  }
}

const formatFileSize = (fileSize: number): string => {
  if (fileSize >= 1024 * 1024) {
    return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
  }

  return `${Math.round(fileSize / 1024)} KB`
}

const loadDetail = async (): Promise<void> => {
  isLoading.value = true

  try {
    const [inventoryItem, categories, locations] = await Promise.all([
      inventoryApi.findByCode(code.value),
      referenceApi.findCategories(),
      referenceApi.findLocations(),
    ])
    item.value = inventoryItem
    categoryName.value =
      categories.find((category) => category.code === inventoryItem.categoryCode)?.name ??
      inventoryItem.categoryCode
    locationName.value = inventoryItem.locationCode
      ? (locations.find((location) => location.code === inventoryItem.locationCode)?.name ??
        inventoryItem.locationCode)
      : 'Not assigned'
    void loadImages()
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

const deleteItem = async (): Promise<void> => {
  if (!item.value) return

  try {
    await ElMessageBox.confirm(
      `Delete “${item.value.name}”? Its uploaded images will also be removed.`,
      'Delete inventory item',
      {
        type: 'warning',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        confirmButtonClass: 'el-button--danger',
      },
    )
    await inventoryApi.delete(item.value.code)
    ElMessage.success('Inventory item deleted.')
    await router.replace('/inventory')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(getApiErrorMessage(error))
    }
  }
}

const deleteImage = async (image: GalleryImage): Promise<void> => {
  try {
    await ElMessageBox.confirm(`Delete “${image.originalFilename}”?`, 'Delete image', {
      type: 'warning',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonClass: 'el-button--danger',
    })
    deletingImageCode.value = image.code
    await imageApi.delete(image.code)
    ElMessage.success('Image deleted.')
    await loadImages()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(getApiErrorMessage(error))
    }
  } finally {
    deletingImageCode.value = null
  }
}

onMounted(loadDetail)
onBeforeUnmount(clearGalleryImages)
</script>

<template>
  <section v-loading="isLoading" class="app-page detail-page">
    <el-breadcrumb separator="/" class="page-breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">Home</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/inventory' }">Inventory</el-breadcrumb-item>
      <el-breadcrumb-item>{{ item?.name ?? code }}</el-breadcrumb-item>
    </el-breadcrumb>

    <template v-if="item">
      <el-card class="app-card detail-hero" shadow="never">
        <div class="detail-hero__content">
          <div>
            <el-button :icon="ArrowLeft" text @click="router.push('/inventory')"
              >Back to inventory</el-button
            >
            <div class="detail-hero__title">
              <h1>{{ item.name }}</h1>
              <el-tag :type="statusTagTypes[item.status]" effect="light" round>
                {{ formatLabel(item.status) }}
              </el-tag>
            </div>
            <p>{{ item.code }} · Updated {{ formatDateTime(item.updatedDate) }}</p>
          </div>

          <div class="detail-hero__actions">
            <el-button :icon="Edit" @click="router.push(`/inventory/${item.code}/edit`)">
              Edit
            </el-button>
            <el-button :icon="Delete" type="danger" plain @click="deleteItem">Delete</el-button>
          </div>
        </div>
      </el-card>

      <div class="detail-layout">
        <div class="detail-main">
          <el-card
            v-loading="isGalleryLoading"
            class="app-card detail-card image-gallery-card"
            shadow="never"
          >
            <template #header>
              <div class="card-heading image-gallery-heading">
                <span>
                  <el-icon><Picture /></el-icon>
                  Images
                  <el-tag effect="plain" round>
                    {{ galleryImages.length }} / {{ MAX_IMAGES_PER_ITEM }}
                  </el-tag>
                </span>
                <el-button
                  v-if="canAddImage"
                  :icon="Upload"
                  @click="router.push(`/inventory/${item.code}/edit`)"
                >
                  Add image
                </el-button>
                <el-tag v-else type="warning" effect="light" round>Limit reached</el-tag>
              </div>
            </template>

            <el-empty
              v-if="!isGalleryLoading && !galleryImages.length"
              :image-size="72"
              description="No images uploaded"
            />

            <div v-else class="inventory-gallery">
              <article v-for="(image, index) in galleryImages" :key="image.code" class="image-tile">
                <div class="image-tile__media">
                  <el-image
                    :src="image.objectUrl"
                    :alt="image.originalFilename"
                    :preview-src-list="previewUrls"
                    :initial-index="index"
                    fit="cover"
                    preview-teleported
                  />
                  <el-tag v-if="image.primary" class="image-tile__primary" type="success" round>
                    Primary
                  </el-tag>
                </div>

                <footer class="image-tile__footer">
                  <div>
                    <strong :title="image.originalFilename">{{ image.originalFilename }}</strong>
                    <small>{{ formatFileSize(image.fileSize) }}</small>
                  </div>
                  <el-tooltip content="Delete image">
                    <el-button
                      :icon="Delete"
                      type="danger"
                      text
                      circle
                      :loading="deletingImageCode === image.code"
                      :disabled="Boolean(deletingImageCode) && deletingImageCode !== image.code"
                      aria-label="Delete image"
                      @click="deleteImage(image)"
                    />
                  </el-tooltip>
                </footer>
              </article>
            </div>
          </el-card>

          <el-card class="app-card detail-card" shadow="never">
            <template #header>
              <div class="card-heading"><span>General information</span></div>
            </template>

            <div class="detail-fields">
              <div class="detail-field detail-field--wide">
                <span>Name</span>
                <strong>{{ item.name }}</strong>
              </div>

              <div class="detail-field">
                <span>Category</span>
                <strong
                  ><el-icon><CollectionTag /></el-icon>{{ categoryName }}</strong
                >
              </div>

              <div class="detail-field">
                <span>Location</span>
                <strong
                  ><el-icon><Location /></el-icon>{{ locationName }}</strong
                >
              </div>

              <div class="detail-field">
                <span>Quantity</span>
                <strong>{{ item.quantity }}</strong>
              </div>

              <div class="detail-field">
                <span>Condition</span>
                <strong
                  ><el-icon><Tickets /></el-icon>{{ formatLabel(item.condition) }}</strong
                >
              </div>

              <div class="detail-field">
                <span>Purchase price</span>
                <strong
                  ><el-icon><Money /></el-icon>{{ formatCurrency(item.purchasePrice) }}</strong
                >
              </div>

              <div class="detail-field">
                <span>Purchase date</span>
                <strong
                  ><el-icon><Calendar /></el-icon>{{ formatDate(item.purchaseDate) }}</strong
                >
              </div>

              <div class="detail-field detail-field--wide detail-field--multiline">
                <span>Description</span>
                <p>{{ item.description || 'No description provided.' }}</p>
              </div>

              <div class="detail-field detail-field--wide detail-field--multiline">
                <span>Notes</span>
                <p>{{ item.notes || 'No notes provided.' }}</p>
              </div>
            </div>
          </el-card>
        </div>

        <aside class="detail-summary">
          <el-card class="app-card" shadow="never">
            <template #header>
              <div class="card-heading"><span>Summary</span></div>
            </template>

            <dl>
              <div>
                <dt>Status</dt>
                <dd>{{ formatLabel(item.status) }}</dd>
              </div>
              <div>
                <dt>Condition</dt>
                <dd>{{ formatLabel(item.condition) }}</dd>
              </div>
              <div>
                <dt>Total quantity</dt>
                <dd>{{ item.quantity }}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{{ formatDateTime(item.createdDate) }}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{{ formatDateTime(item.updatedDate) }}</dd>
              </div>
            </dl>
          </el-card>
        </aside>
      </div>
    </template>

    <el-card v-else-if="!isLoading" class="app-card not-found-card" shadow="never">
      <el-empty description="Inventory item could not be loaded">
        <el-button type="primary" @click="router.push('/inventory')">Back to inventory</el-button>
      </el-empty>
    </el-card>
  </section>
</template>
