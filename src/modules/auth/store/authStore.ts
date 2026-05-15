import { ref, readonly, computed } from 'vue'
import { AuthService, type User, type Session } from '../services/AuthService'

const user = ref<User | null>(null)
const session = ref<Session | null>(null)
const isLoading = ref(true)
const isRecoveryFlow = ref(false)
const error = ref<string | null>(null)

export const authStore = {
    user: readonly(user),
    session: readonly(session),
    isLoading: readonly(isLoading),
    isRecoveryFlow: readonly(isRecoveryFlow),
    error: readonly(error),

    isAuthenticated: computed(() => !!user.value),
    currentUserId: computed(() => user.value?.id),

    async init() {
        isLoading.value = true
        try {
            const { session: currentSession } = await AuthService.getSession()
            session.value = currentSession
            user.value = currentSession?.user || null
        } catch (e: any) {
            console.error('Auth init error:', e)
        } finally {
            isLoading.value = false
        }

        // Listen for auth changes to keep state in sync
        AuthService.onAuthStateChange((event, currentSession) => {
            console.log('Auth event:', event)
            
            if (event === 'PASSWORD_RECOVERY') {
                isRecoveryFlow.value = true
            }

            if (event === 'SIGNED_OUT') {
                isRecoveryFlow.value = false
            }

            session.value = currentSession
            user.value = currentSession?.user || null
            isLoading.value = false
        })
    },

    async login(email: string, password: string) {
        isLoading.value = true
        error.value = null
        try {
            const { data, error: authError } = await AuthService.signInWithPassword(email, password)
            if (authError) throw authError

            session.value = data.session
            user.value = data.user
            return true
        } catch (e: any) {
            error.value = e.message
            return false
        } finally {
            isLoading.value = false
        }
    },

    async register(email: string, password: string) {
        isLoading.value = true
        error.value = null
        try {
            const { data, error: authError } = await AuthService.signUp(email, password)
            if (authError) throw authError

            // If email confirmation is off, we get session. If on, maybe null session.
            if (data.session) {
                session.value = data.session
                user.value = data.user
                return { success: true }
            } else if (data.user && !data.session) {
                return { success: true, message: 'Check email for confirmation' }
            }
            return { success: false }
        } catch (e: any) {
            error.value = e.message
            return { success: false, error: e.message }
        } finally {
            isLoading.value = false
        }
    },

    async logout() {
        // Immediate UI feedback
        user.value = null
        session.value = null
        isRecoveryFlow.value = false
        await AuthService.signOut().catch(console.error)
    },

    async sendResetLink(email: string) {
        isLoading.value = true
        error.value = null
        try {
            const { error: authError } = await AuthService.resetPasswordForEmail(email)
            if (authError) throw authError
            return true
        } catch (e: any) {
            error.value = e.message
            return false
        } finally {
            isLoading.value = false
        }
    },

    async updatePassword(password: string) {
        isLoading.value = true
        error.value = null
        try {
            const { error: authError } = await AuthService.updateUserPassword(password)
            if (authError) throw authError
            isRecoveryFlow.value = false
            return true
        } catch (e: any) {
            error.value = e.message
            return false
        } finally {
            isLoading.value = false
        }
    }
}
