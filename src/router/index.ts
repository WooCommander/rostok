import { createRouter, createWebHistory } from 'vue-router'
import { authStore } from '@/modules/auth/store/authStore'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/modules/auth/views/LoginView.vue')
    },
    {
        path: '/',
        name: 'Today',
        component: () => import('@/views/TodayView.vue')
    },
    {
        path: '/plants',
        name: 'Plants',
        component: () => import('@/views/PlantsView.vue')
    },
    {
        path: '/plants/:id',
        name: 'PlantDetail',
        component: () => import('@/views/PlantDetailView.vue')
    },
    {
        path: '/journal',
        name: 'Journal',
        component: () => import('@/views/JournalView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/journal/add',
        name: 'AddTreatment',
        component: () => import('@/views/AddTreatmentView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('@/modules/profile/views/ProfileView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/design-system',
        name: 'DesignSystem',
        component: () => import('@/views/DesignSystemView.vue')
    },
    {
        path: '/about',
        name: 'About',
        component: () => import('@/views/AboutView.vue')
    },
    {
        path: '/products',
        name: 'Products',
        component: () => import('@/views/ProductsView.vue')
    },
    {
        path: '/products/:id',
        name: 'ProductDetail',
        component: () => import('@/views/ProductDetailView.vue')
    },
    {
        path: '/calculator',
        name: 'Calculator',
        component: () => import('@/views/CalculatorView.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to, _from, next) => {
    const { isAuthenticated, isLoading } = authStore

    if (isLoading.value) { /* wait */ }

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

    if (requiresAuth && !isAuthenticated.value) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
    } else {
        next()
    }
})

export default router
