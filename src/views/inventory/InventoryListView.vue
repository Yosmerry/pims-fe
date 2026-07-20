<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Delete, Edit, Filter, Plus, Refresh, Search, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

import { inventoryApi } from '@/api/inventory.api'
import { referenceApi } from '@/api/reference.api'
import {
  INVENTORY_CONDITIONS,
  INVENTORY_SORTS,
  INVENTORY_STATUSES,
  type InventoryCondition,
  type InventoryItem,
  type InventorySort,
  type InventoryStatus,
} from '@/types/inventory'
import type { PageResponse } from '@/types/pagination'
import type { ReferenceItem } from '@/types/reference'
import { getApiErrorMessage } from '@/utils/api-error'
import { formatDateTime, formatLabel } from '@/utils/format'

const router = useRouter()
const isLoading = ref(false)
const categories = ref<ReferenceItem[]>([])
const locations = ref<ReferenceItem[]>([])

const filters = reactive({
  search: '',
  categoryCode: '',
  locationCode: '',
  condition: '' as InventoryCondition | '',
  status: '' as InventoryStatus | '',
  sortBy: 'updatedDate:desc' as InventorySort,
})

const result = reactive<PageResponse<InventoryItem>>({
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
})

const categoryNames = computed(() =>
  Object.fromEntries(categories.value.map((category) => [category.code, category.name])),
)
const locationNames = computed(() =>
  Object.fromEntries(locations.value.map((location) => [location.code, location.name])),
)
const activeFilterCount = computed(
  () =>
    [
      filters.search,
      filters.categoryCode,
      filters.locationCode,
      filters.condition,
      filters.status,
    ].filter(Boolean).length,
)

const statusTagTypes: Record<InventoryStatus, 'success' | 'warning' | 'info' | 'danger'> = {
  OWNED: 'success',
  LOANED: 'warning',
  SOLD: 'info',
  LOST: 'danger',
  DISPOSED: 'info',
}

const conditionTagTypes: Record<InventoryCondition, 'success' | 'warning' | 'info' | 'danger'> = {
  NEW: 'success',
  GOOD: 'success',
  FAIR: 'warning',
  POOR: 'danger',
  DAMAGED: 'danger',
}

const sortLabels: Record<InventorySort, string> = {
  'updatedDate:desc': 'Recently updated',
  'updatedDate:asc': 'Oldest updated',
  'name:asc': 'Name A–Z',
  'name:desc': 'Name Z–A',
  'purchaseDate:desc': 'Newest purchase',
  'purchaseDate:asc': 'Oldest purchase',
}

const loadReferences = async (): Promise<void> => {
  try {
    const [categoryResult, locationResult] = await Promise.all([
      referenceApi.findCategories(),
      referenceApi.findLocations(),
    ])
    categories.value = categoryResult
    locations.value = locationResult
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error))
  }
}

const loadItems = async (): Promise<void> => {
  isLoading.value = true

  try {
    const response = await inventoryApi.findAll({
      page: result.page,
      size: result.size,
      search: filters.search.trim() || undefined,
      categoryCode: filters.categoryCode || undefined,
      locationCode: filters.locationCode || undefined,
      condition: filters.condition || undefined,
      status: filters.status || undefined,
      sortBy: filters.sortBy,
    })
    Object.assign(result, response)
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error))
  } finally {
    isLoading.value = false
  }
}

const applyFilters = (): void => {
  result.page = 0
  void loadItems()
}

const resetFilters = (): void => {
  filters.search = ''
  filters.categoryCode = ''
  filters.locationCode = ''
  filters.condition = ''
  filters.status = ''
  filters.sortBy = 'updatedDate:desc'
  result.page = 0
  void loadItems()
}

const changePage = (page: number): void => {
  result.page = page - 1
  void loadItems()
}

const changePageSize = (size: number): void => {
  result.size = size
  result.page = 0
  void loadItems()
}

const deleteItem = async (item: InventoryItem): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      `Delete “${item.name}”? Its uploaded images will also be removed.`,
      'Delete inventory item',
      {
        type: 'warning',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        confirmButtonClass: 'el-button--danger',
      },
    )
    await inventoryApi.delete(item.code)
    ElMessage.success('Inventory item deleted.')

    if (result.content.length === 1 && result.page > 0) {
      result.page -= 1
    }
    await loadItems()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(getApiErrorMessage(error))
    }
  }
}

onMounted(() => {
  void Promise.all([loadReferences(), loadItems()])
})
</script>

<template>
  <section class="inventory-page">
    <el-breadcrumb separator="/" class="page-breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">Home</el-breadcrumb-item>
      <el-breadcrumb-item>Inventory</el-breadcrumb-item>
    </el-breadcrumb>

    <header class="page-heading">
      <p class="eyebrow">Your belongings</p>
      <el-button type="primary" :icon="Plus" size="large" @click="router.push('/inventory/new')">
        Add item
      </el-button>
    </header>

    <div class="inventory-list-layout">
      <el-card class="filter-card" shadow="never">
        <template #header>
          <div class="card-heading">
            <span
              ><el-icon><Filter /></el-icon> Filters</span
            >
            <el-badge v-if="activeFilterCount" :value="activeFilterCount" type="primary" />
          </div>
        </template>

        <el-form label-position="top" @submit.prevent="applyFilters">
          <el-form-item label="Search">
            <el-input
              v-model="filters.search"
              :prefix-icon="Search"
              clearable
              maxlength="150"
              placeholder="Name, description, notes"
              @keyup.enter="applyFilters"
            />
          </el-form-item>

          <el-form-item label="Category">
            <el-select
              v-model="filters.categoryCode"
              clearable
              filterable
              placeholder="All categories"
            >
              <el-option
                v-for="category in categories"
                :key="category.code"
                :label="category.name"
                :value="category.code"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Location">
            <el-select
              v-model="filters.locationCode"
              clearable
              filterable
              placeholder="All locations"
            >
              <el-option
                v-for="location in locations"
                :key="location.code"
                :label="location.name"
                :value="location.code"
              />
            </el-select>
          </el-form-item>

          <div class="filter-card__row">
            <el-form-item label="Condition">
              <el-select v-model="filters.condition" clearable placeholder="Any">
                <el-option
                  v-for="condition in INVENTORY_CONDITIONS"
                  :key="condition"
                  :label="formatLabel(condition)"
                  :value="condition"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="Status">
              <el-select v-model="filters.status" clearable placeholder="Any">
                <el-option
                  v-for="status in INVENTORY_STATUSES"
                  :key="status"
                  :label="formatLabel(status)"
                  :value="status"
                />
              </el-select>
            </el-form-item>
          </div>

          <el-form-item label="Sort by">
            <el-select v-model="filters.sortBy">
              <el-option
                v-for="sort in INVENTORY_SORTS"
                :key="sort"
                :label="sortLabels[sort]"
                :value="sort"
              />
            </el-select>
          </el-form-item>

          <div class="filter-card__actions">
            <el-button :icon="Refresh" @click="resetFilters">Reset</el-button>
            <el-button type="primary" native-type="submit">Apply filters</el-button>
          </div>
        </el-form>
      </el-card>

      <el-card class="inventory-table-card" shadow="never">
        <template #header>
          <div class="table-card-heading">
            <div>
              <h2>Inventory items</h2>
              <p>{{ result.totalElements }} {{ result.totalElements === 1 ? 'item' : 'items' }}</p>
            </div>
            <el-button :icon="Refresh" circle aria-label="Refresh items" @click="loadItems" />
          </div>
        </template>

        <div class="inventory-table-wrap">
          <el-table
            v-loading="isLoading"
            :data="result.content"
            empty-text="No inventory items found"
          >
            <el-table-column label="Item" min-width="220">
              <template #default="{ row }: { row: InventoryItem }">
                <button
                  class="item-name-cell"
                  type="button"
                  @click="router.push(`/inventory/${row.code}`)"
                >
                  <span>{{ row.name }}</span>
                  <small>{{ row.code }}</small>
                </button>
              </template>
            </el-table-column>

            <el-table-column label="Category" min-width="150">
              <template #default="{ row }: { row: InventoryItem }">
                {{ categoryNames[row.categoryCode] ?? row.categoryCode }}
              </template>
            </el-table-column>

            <el-table-column label="Location" min-width="145">
              <template #default="{ row }: { row: InventoryItem }">
                {{ row.locationCode ? (locationNames[row.locationCode] ?? row.locationCode) : '—' }}
              </template>
            </el-table-column>

            <el-table-column prop="quantity" label="Qty" width="72" align="center" />

            <el-table-column label="Condition" width="112">
              <template #default="{ row }: { row: InventoryItem }">
                <el-tag :type="conditionTagTypes[row.condition]" effect="light" round>
                  {{ formatLabel(row.condition) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="Status" width="110">
              <template #default="{ row }: { row: InventoryItem }">
                <el-tag :type="statusTagTypes[row.status]" effect="light" round>
                  {{ formatLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="Updated" min-width="165">
              <template #default="{ row }: { row: InventoryItem }">
                {{ formatDateTime(row.updatedDate) }}
              </template>
            </el-table-column>

            <el-table-column label="Actions" width="150" fixed="right">
              <template #default="{ row }: { row: InventoryItem }">
                <div class="table-actions">
                  <el-tooltip content="View details">
                    <el-button :icon="View" circle @click="router.push(`/inventory/${row.code}`)" />
                  </el-tooltip>
                  <el-tooltip content="Edit item">
                    <el-button
                      :icon="Edit"
                      circle
                      @click="router.push(`/inventory/${row.code}/edit`)"
                    />
                  </el-tooltip>
                  <el-tooltip content="Delete item">
                    <el-button :icon="Delete" circle type="danger" plain @click="deleteItem(row)" />
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
    </div>
  </section>
</template>
