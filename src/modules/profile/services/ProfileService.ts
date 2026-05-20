import { useProfileState } from '../state/useProfileState'

export const ProfileService = {
  addXp(amount: number): void {
    const { addXp } = useProfileState()
    addXp(amount)
  },

  getXp(): number {
    const { userXp, loadXp } = useProfileState()
    loadXp()
    return userXp.value
  }
}
