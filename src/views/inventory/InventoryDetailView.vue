<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ArrowLeft,
  Calendar,
  CollectionTag,
  Delete,
  Edit,
  Location,
  Money,
  Tickets,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import { inventoryApi } from '@/api/inventory.api'
import { referenceApi } from '@/api/reference.api'
import type { InventoryItem, InventoryStatus } from '@/types/inventory'
import { getApiErrorMessage } from '@/utils/api-error'
import { formatCurrency, formatDate, formatDateTime, formatLabel } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const isLoading = ref(true)
const item = ref<InventoryItem | null>(null)
const categoryName = ref('—')
const locationName = ref('—')

const code = computed(() => String(route.params.code))
const statusTagTypes: Record<InventoryStatus, 'success' | 'warning' | 'info' | 'danger'> = {
  OWNED: 'success',
  LOANED: 'warning',
  SOLD: 'info',
  LOST: 'danger',
  DISPOSED: 'info',
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

onMounted(loadDetail)
</script>

<template>
  <section v-loading="isLoading" class="inventory-page detail-page">
    <el-breadcrumb separator="/" class="page-breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">Home</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/inventory' }">Inventory</el-breadcrumb-item>
      <el-breadcrumb-item>{{ item?.name ?? code }}</el-breadcrumb-item>
    </el-breadcrumb>

    <template v-if="item">
      <el-card class="detail-hero" shadow="never">
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
        <el-card class="detail-card" shadow="never">
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

        <aside class="detail-summary">
          <el-card shadow="never">
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

    <el-card v-else-if="!isLoading" class="not-found-card" shadow="never">
      <el-empty description="Inventory item could not be loaded">
        <el-button type="primary" @click="router.push('/inventory')">Back to inventory</el-button>
      </el-empty>
    </el-card>
  </section>
</template>
