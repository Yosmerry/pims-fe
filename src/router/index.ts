import { createRouter, createWebHistory } from 'vue-router'

import { getAccessToken } from '@/utils/auth-session'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/inventory',
        },
        {
          path: 'inventory',
          name: 'inventory-list',
          component: () => import('@/views/inventory/InventoryListView.vue'),
        },
        {
          path: 'inventory/new',
          name: 'inventory-create',
          component: () => import('@/views/inventory/InventoryFormView.vue'),
        },
        {
          path: 'inventory/:code',
          name: 'inventory-detail',
          component: () => import('@/views/inventory/InventoryDetailView.vue'),
        },
        {
          path: 'inventory/:code/edit',
          name: 'inventory-edit',
          component: () => import('@/views/inventory/InventoryFormView.vue'),
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const isAuthenticated = Boolean(getAccessToken())

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return { name: 'inventory-list' }
  }

  return true
})

export default router
