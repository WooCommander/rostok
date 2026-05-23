import { ref, computed } from 'vue'
import { PlantService, type Plant, type UserPlant } from '../services/PlantService'

// Глобальное состояние
const plants = ref<Plant[]>([])
const userPlantsList = ref<UserPlant[]>([])
const loading = ref(false)
const initialized = ref(false)

export function usePlantsState() {
  const userPlantIds = computed(() => userPlantsList.value.map(u => u.plant_id))

  async function loadData(force = false) {
    if (initialized.value && !force) return
    
    loading.value = true
    try {
      const [allPlants, myPlants] = await Promise.all([
        PlantService.getAll(),
        PlantService.getUserPlants()
      ])
      plants.value = allPlants
      userPlantsList.value = myPlants
      initialized.value = true
    } catch (e) {
      console.error('Ошибка загрузки данных растений:', e)
    } finally {
      loading.value = false
    }
  }

  async function toggleUserPlant(plantId: string) {
    try {
      const isNowInGarden = await PlantService.toggleUserPlant(plantId)
      if (isNowInGarden) {
        if (!userPlantIds.value.includes(plantId)) {
          const newInst = await PlantService.addUserPlantInstance(plantId)
          userPlantsList.value.push(newInst)
        }
      } else {
        const toDel = userPlantsList.value.filter(u => u.plant_id === plantId)
        for (const item of toDel) {
          await PlantService.removeUserPlant(item.id)
        }
        userPlantsList.value = userPlantsList.value.filter(u => u.plant_id !== plantId)
      }
      return isNowInGarden
    } catch (e) {
      throw e
    }
  }

  async function addAnotherInstance(plantId: string) {
    try {
      const newInst = await PlantService.addUserPlantInstance(plantId)
      userPlantsList.value.push(newInst)
      return newInst
    } catch (e) {
      throw e
    }
  }

  async function updateInstance(id: string, updates: Partial<UserPlant>) {
    try {
      const updated = await PlantService.updateUserPlant(id, updates)
      const idx = userPlantsList.value.findIndex(u => u.id === id)
      if (idx !== -1) {
        userPlantsList.value[idx] = updated
      }
      return updated
    } catch (e) {
      throw e
    }
  }

  async function removeInstance(id: string) {
    try {
      await PlantService.removeUserPlant(id)
      userPlantsList.value = userPlantsList.value.filter(u => u.id !== id)
    } catch (e) {
      throw e
    }
  }

  return {
    plants,
    userPlantsList,
    userPlantIds,
    loading,
    initialized,
    loadData,
    toggleUserPlant,
    addAnotherInstance,
    updateInstance,
    removeInstance
  }
}
