<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { authStore } from '../store/authStore'
import FpInput from '@/design-system/components/FpInput.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import FpCard from '@/design-system/components/FpCard.vue'
import { useI18n } from 'vue-i18n'

type ViewMode = 'login' | 'register' | 'forgot' | 'reset'

const router = useRouter()
const { t } = useI18n()

const viewMode = ref<ViewMode>('login')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const successMessage = ref('')

// Handle recovery flow from store
watch(() => authStore.isRecoveryFlow.value, (isRecovering) => {
    if (isRecovering) {
        viewMode.value = 'reset'
    }
}, { immediate: true })

const toggleMode = (mode: ViewMode) => {
    viewMode.value = mode
    error.value = ''
    successMessage.value = ''
    password.value = ''
    confirmPassword.value = ''
}

const handleSubmit = async () => {
    error.value = ''
    successMessage.value = ''

    // Basic validation
    if (!email.value && viewMode.value !== 'reset') {
        error.value = t('login.errors.fillAll')
        return
    }

    if (viewMode.value !== 'forgot' && !password.value) {
        error.value = t('login.errors.fillAll')
        return
    }

    if (viewMode.value !== 'forgot' && password.value.length < 6) {
        error.value = t('login.errors.shortPassword')
        return
    }

    // Confirm password validation
    if ((viewMode.value === 'register' || viewMode.value === 'reset') && password.value !== confirmPassword.value) {
        error.value = t('login.errors.passwordMismatch')
        return
    }

    if (viewMode.value === 'login') {
        const success = await authStore.login(email.value, password.value)
        if (success) {
            const redirectPath = (router.currentRoute.value.query.redirect as string) || '/'
            router.push(redirectPath)
        } else {
            handleError(authStore.error.value || t('login.errors.loginFailed'))
        }
    } else if (viewMode.value === 'register') {
        const result: any = await authStore.register(email.value, password.value)
        if (result.success) {
            if (result.message) {
                successMessage.value = t('login.successRegister')
                viewMode.value = 'login'
                password.value = ''
            } else {
                const redirectPath = (router.currentRoute.value.query.redirect as string) || '/'
                router.push(redirectPath)
            }
        } else {
            error.value = result.error || t('login.errors.registerFailed')
        }
    } else if (viewMode.value === 'forgot') {
        const success = await authStore.sendResetLink(email.value)
        if (success) {
            successMessage.value = t('login.resetEmailSent')
            // Don't auto-switch, let user read message
        } else {
            error.value = authStore.error.value || t('login.errors.resetFailed')
        }
    } else if (viewMode.value === 'reset') {
        const success = await authStore.updatePassword(password.value)
        if (success) {
            successMessage.value = t('login.passwordUpdated')
            setTimeout(() => {
                router.push('/')
            }, 2000)
        } else {
            error.value = authStore.error.value || t('login.errors.resetFailed')
        }
    }
}

const handleError = (errorMessage: string) => {
    if (errorMessage.toLowerCase().includes('email not confirmed')) {
        error.value = t('login.errors.notConfirmed')
    } else if (errorMessage.toLowerCase().includes('invalid login credentials')) {
        error.value = t('login.errors.invalidCredentials')
    } else {
        error.value = errorMessage
    }
}
</script>

<template>
    <div class="auth-view">
        <FpCard class="auth-card">
            <h1 class="title">
                <template v-if="viewMode === 'login'">{{ t('login.title') }}</template>
                <template v-else-if="viewMode === 'register'">{{ t('login.registerTitle') }}</template>
                <template v-else-if="viewMode === 'forgot'">{{ t('login.forgotPassword') }}</template>
                <template v-else-if="viewMode === 'reset'">{{ t('login.setNewPassword') }}</template>
            </h1>

            <div class="form">
                <div class="error-alert" v-if="error">{{ error }}</div>
                <div class="success-alert" v-if="successMessage">{{ successMessage }}</div>

                <!-- Email field (not shown in reset mode) -->
                <FpInput 
                    v-if="viewMode !== 'reset'"
                    v-model="email" 
                    :label="t('login.email')" 
                    type="email" 
                    placeholder="name@example.com" 
                />

                <!-- Password field (not shown in forgot mode) -->
                <FpInput 
                    v-if="viewMode !== 'forgot'"
                    v-model="password" 
                    :label="viewMode === 'reset' ? t('login.setNewPassword') : t('login.password')" 
                    type="password" 
                    placeholder="••••••"
                />

                <!-- Confirm Password (shown in register and reset) -->
                <FpInput 
                    v-if="viewMode === 'register' || viewMode === 'reset'"
                    v-model="confirmPassword" 
                    :label="t('login.confirmPassword')" 
                    type="password" 
                    placeholder="••••••"
                    @keyup.enter="handleSubmit"
                />

                <div class="actions">
                    <FpButton :loading="authStore.isLoading.value" size="full" @click="handleSubmit">
                        <template v-if="viewMode === 'login'">{{ t('login.submitLogin') }}</template>
                        <template v-else-if="viewMode === 'register'">{{ t('login.submitRegister') }}</template>
                        <template v-else-if="viewMode === 'forgot'">{{ t('login.sendResetLink') }}</template>
                        <template v-else-if="viewMode === 'reset'">{{ t('login.updatePassword') }}</template>
                    </FpButton>
                </div>

                <div class="secondary-actions">
                    <div class="toggle-mode">
                        <template v-if="viewMode === 'login'">
                            <div class="forgot-link">
                                <a href="#" @click.prevent="toggleMode('forgot')">{{ t('login.forgotPassword') }}</a>
                            </div>
                            <span>
                                {{ t('login.noAccount') }} <a href="#" @click.prevent="toggleMode('register')">{{ t('login.create') }}</a>
                            </span>
                        </template>
                        <template v-else-if="viewMode === 'register'">
                            <span>
                                {{ t('login.haveAccount') }} <a href="#" @click.prevent="toggleMode('login')">{{ t('login.enter') }}</a>
                            </span>
                        </template>
                        <template v-else-if="viewMode === 'forgot'">
                            <a href="#" @click.prevent="toggleMode('login')">{{ t('login.backToLogin') }}</a>
                        </template>
                    </div>
                </div>
            </div>
        </FpCard>
    </div>
</template>

<style scoped lang="scss">
.auth-view {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    padding: var(--spacing-md);
    background: radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 32%),
        radial-gradient(circle at 80% 10%, color-mix(in srgb, var(--color-secondary) 6%, transparent), transparent 28%),
        var(--color-background);
}

.auth-card {
    width: 100%;
    max-width: 400px;
    padding: 28px 24px 32px;
}

.title {
    text-align: center;
    margin-bottom: var(--spacing-lg);
    font-size: var(--text-h3);
}

.form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.actions {
    margin-top: var(--spacing-sm);
}

.secondary-actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: center;
    margin-top: var(--spacing-md);
}

.toggle-mode {
    font-size: var(--text-body-2);
    color: var(--color-text-secondary);

    a {
        color: var(--color-primary);
        font-weight: 600;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
}

.forgot-link {
    margin-bottom: var(--spacing-xs);
    
    a {
        font-weight: 400;
        font-size: var(--text-caption);
    }
}

.error-alert {
    background: color-mix(in srgb, var(--color-error) 15%, transparent);
    color: var(--color-error);
    padding: 12px;
    border-radius: var(--radius-sm);
    font-size: var(--text-caption);
    text-align: center;
}

.success-alert {
    background: color-mix(in srgb, var(--color-success) 15%, transparent);
    color: var(--color-success);
    padding: 12px;
    border-radius: var(--radius-sm);
    font-size: var(--text-caption);
    text-align: center;
}

/* Normalize browser autofill colors to match design system */
:deep(input:-webkit-autofill),
:deep(input:-webkit-autofill:hover),
:deep(input:-webkit-autofill:focus) {
    -webkit-text-fill-color: var(--color-text-primary);
    box-shadow: 0 0 0px 1000px var(--color-surface) inset;
    transition: background-color 9999s ease-in-out 0s;
}
</style>
