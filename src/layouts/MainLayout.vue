<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { authStore } from '@/modules/auth/store/authStore'
import { changelog } from '@/data/changelog'
import {
  Home, Leaf, User, ClipboardList, Menu, X,
  FileText, LogOut, Sun, Moon, Plus, Palette, ArrowUp, ShieldAlert, Calculator, Info
} from 'lucide-vue-next'
import { FpHaptics } from '@/shared/lib/haptics'

const router = useRouter()
const route = useRoute()
const { isDark, toggleTheme } = useTheme()

const userRef = computed(() => authStore.user.value)
const appVersion = changelog[0]?.version || ''
const avatarLetter = computed(() => userRef.value?.email?.charAt(0).toUpperCase() || '?')
const isMenuOpen = ref(false)
const showScrollTop = ref(false)

const currentPath = computed(() => route.path)

const checkScroll = () => {
  showScrollTop.value = window.scrollY > 500
}

const scrollToTop = () => {
  FpHaptics.light()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', checkScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll)
})

const handleProfileClick = async () => {
  FpHaptics.light()
  if (userRef.value) {
    router.push('/profile')
  } else {
    if (authStore.isLoading.value) return
    await authStore.init()
    router.push(userRef.value ? '/profile' : '/login')
  }
}

const navigate = (path: string) => {
  FpHaptics.light()
  router.push(path)
  isMenuOpen.value = false
}

const handleLogout = async () => {
  isMenuOpen.value = false
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="main-layout">

    <!-- Top bar -->
    <header class="top-nav">
      <div class="nav-container">
        <div class="logo-area">
          <button class="hamburger-btn" @click="isMenuOpen = true">
            <Menu :size="22" />
          </button>
          <div class="logo" @click="router.push('/')">
            🌱 Rostok
            <span v-if="appVersion" class="version-pill">v{{ appVersion }}</span>
          </div>
        </div>

        <div class="profile-chip" :class="{ guest: !userRef }" @click="handleProfileClick">
          <span class="avatar-letter">{{ avatarLetter }}</span>
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="page-content">
      <div class="content-container">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
      <a class="nav-item" :class="{ active: currentPath === '/' }" @click.prevent="navigate('/')">
        <Home class="icon" :size="20" />
        <span class="label">Сегодня</span>
      </a>
      <a class="nav-item" :class="{ active: currentPath.startsWith('/plants') }" @click.prevent="navigate('/plants')">
        <Leaf class="icon" :size="20" />
        <span class="label">Растения</span>
      </a>
      <div class="nav-item action" @click="navigate('/journal/add')">
        <div class="plus-btn" :class="{ active: currentPath === '/journal/add' }">
          <Plus :size="24" :stroke-width="3" />
        </div>
        <span class="label">Запись</span>
      </div>
      <a class="nav-item" :class="{ active: currentPath === '/journal' }" @click.prevent="navigate('/journal')">
        <ClipboardList class="icon" :size="20" />
        <span class="label">Журнал</span>
      </a>
      <a class="nav-item" :class="{ active: currentPath === '/profile' }" @click.prevent="navigate('/profile')">
        <User class="icon" :size="20" />
        <span class="label">Профиль</span>
      </a>
    </nav>

    <!-- Scroll to Top Button -->
    <transition name="fade-scale">
      <button v-if="showScrollTop" class="scroll-top-btn" @click="scrollToTop" title="Наверх">
        <ArrowUp :size="24" />
      </button>
    </transition>

    <!-- Backdrop -->
    <transition name="fade">
      <div v-if="isMenuOpen" class="menu-backdrop" @click="isMenuOpen = false"></div>
    </transition>

    <!-- Side Drawer -->
    <transition name="slide-right">
      <div v-if="isMenuOpen" class="menu-drawer">
        <div class="drawer-header">
          <div class="drawer-user">
            <div class="drawer-avatar">{{ avatarLetter }}</div>
            <div class="drawer-user-info">
              <span class="drawer-email">{{ userRef?.email || 'Гость' }}</span>
              <span v-if="userRef" class="drawer-status">Online</span>
              <button v-else class="link-btn" @click="navigate('/login')">Войти</button>
            </div>
          </div>
          <button class="close-btn" @click="isMenuOpen = false">
            <X :size="22" />
          </button>
        </div>

        <div class="drawer-content">
          <div class="nav-group">
            <span class="nav-label">Навигация</span>
            <a class="drawer-link" :class="{ active: currentPath === '/' }" @click.prevent="navigate('/')">
              <Home :size="20" class="link-icon" /> Сегодня
            </a>
            <a class="drawer-link" :class="{ active: currentPath.startsWith('/plants') }" @click.prevent="navigate('/plants')">
              <Leaf :size="20" class="link-icon" /> Растения
            </a>
            <a class="drawer-link" :class="{ active: currentPath === '/journal' }" @click.prevent="navigate('/journal')">
              <ClipboardList :size="20" class="link-icon" /> Журнал
            </a>
            <a class="drawer-link" :class="{ active: currentPath.startsWith('/products') }" @click.prevent="navigate('/products')">
              <ShieldAlert :size="20" class="link-icon" /> Справочник препаратов
            </a>
            <a class="drawer-link" :class="{ active: currentPath === '/calculator' }" @click.prevent="navigate('/calculator')">
              <Calculator :size="20" class="link-icon" /> Агрокалькулятор
            </a>
          </div>

          <div class="nav-group">
            <span class="nav-label">Разное</span>
            <a class="drawer-link" :class="{ active: currentPath === '/about' }" @click.prevent="navigate('/about')">
              <Info :size="20" class="link-icon" /> О приложении
            </a>
            <a class="drawer-link" :class="{ active: currentPath === '/design-system' }" @click.prevent="navigate('/design-system')">
              <Palette :size="20" class="link-icon" /> Дизайн-система
            </a>
          </div>
        </div>

        <div class="drawer-footer">
          <button class="theme-toggle-drawer" @click="toggleTheme">
            <Sun v-if="isDark" :size="18" />
            <Moon v-else :size="18" />
            {{ isDark ? 'Светлая тема' : 'Тёмная тема' }}
          </button>
          <button v-if="userRef" class="logout-drawer" @click="handleLogout">
            <LogOut :size="18" />
            Выйти
          </button>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped lang="scss">
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background);
}

/* ── TOP NAV ── */
.top-nav {
  background: var(--color-surface-translucent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 1000;
  padding-top: env(safe-area-inset-top, 0px);
}

.nav-container {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;

  .version-pill {
    font-size: 10px;
    font-weight: 700;
    color: var(--color-text-tertiary);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    padding: 2px 7px;
  }
}

.hamburger-btn {
  background: none;
  border: none;
  color: var(--color-text-primary);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  &:hover { background: var(--color-surface-hover); }
}

.profile-chip {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 30%, transparent);
  transition: transform 0.15s;
  &:active { transform: scale(0.92); }
  &.guest { background: var(--color-text-tertiary); box-shadow: none; }
}

/* ── CONTENT ── */
.page-content {
  flex: 1;
  overflow-y: visible;
}

.content-container {
  max-width: 100%;
  flex: 1;
  @media (max-width: 768px) {
    padding-bottom: 72px;
  }
}

/* ── BOTTOM NAV ── */
.bottom-nav {
  display: none;

  @media (max-width: 768px) {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: calc(60px + env(safe-area-inset-bottom, 0px));
    background: var(--color-surface-translucent);
    backdrop-filter: blur(12px);
    border-top: 1px solid var(--color-border);
    z-index: 1000;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    justify-content: space-around;
    align-items: center;
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--color-text-tertiary);
    text-decoration: none;
    flex: 1;
    gap: 3px;
    cursor: pointer;
    transition: color 0.15s;
    position: relative;

    .label {
      font-size: 10px;
      font-weight: 500;
    }

    &.active {
      color: var(--color-primary);
      .label { font-weight: 700; }
    }

    &.action {
      position: relative;
      top: -10px;
      .plus-btn {
        width: 48px;
        height: 48px;
        background: var(--color-primary);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px color-mix(in srgb, var(--color-primary) 35%, transparent);
        margin-bottom: 2px;
        transition: transform 0.15s;
        &.active { box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 20%, transparent); }
      }
      &:active .plus-btn { transform: scale(0.9); }
    }
  }
}

/* ── DRAWER ── */
.menu-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 2000;
  backdrop-filter: blur(3px);
}

.menu-drawer {
  position: fixed;
  top: 0;
  left: 0;
  width: 80%;
  max-width: 300px;
  height: 100dvh;
  background: var(--color-surface);
  z-index: 2005;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-3);
  border-right: 1px solid var(--color-border);
}

.drawer-header {
  padding: 20px 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-user {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.drawer-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}

.drawer-user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.drawer-email {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawer-status {
  font-size: 11px;
  color: var(--color-success, #52B788);
}

.link-btn {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.close-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  &:hover { background: var(--color-surface-hover); }
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.nav-group { display: flex; flex-direction: column; }

.nav-label {
  padding: 0 20px 6px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-tertiary);
  font-weight: 700;
}

.drawer-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 20px;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.15s;

  .link-icon { color: var(--color-text-tertiary); transition: color 0.15s; }

  &:hover, &.active {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
    .link-icon { color: var(--color-primary); }
  }
  &.active { border-left-color: var(--color-primary); }
}

.drawer-footer {
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.theme-toggle-drawer,
.logout-drawer {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px 12px;
  background: none;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: background 0.15s;
  &:hover { background: var(--color-surface-hover); color: var(--color-text-primary); }
}

.logout-drawer:hover { color: var(--color-error); }

/* ── SCROLL TO TOP ── */
.scroll-top-btn {
  position: fixed;
  bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  border: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
  transition: transform 0.15s, background 0.15s;

  &:hover {
    background: color-mix(in srgb, var(--color-primary) 90%, white);
    transform: translateY(-2px);
  }
  &:active {
    transform: scale(0.92);
  }

  @media (min-width: 769px) {
    bottom: 30px;
    right: 30px;
  }
}

/* ── TRANSITIONS ── */
.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.25s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(-100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-scale-enter-active, .fade-scale-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-scale-enter-from, .fade-scale-leave-to { opacity: 0; transform: scale(0.8); }
</style>
