import { PlantRepository } from './PlantRepository'
import { UserPlantRepository } from './UserPlantRepository' 
import { TreatmentRepository } from './TreatmentRepository'

export { BaseRepository } from '../base/BaseRepository'
export { PlantRepository } from './PlantRepository'
export { UserPlantRepository } from './UserPlantRepository'
export { TreatmentRepository } from './TreatmentRepository'

// Создаем экземпляры репозиториев для использования в сервисах
export const plantRepository = new PlantRepository()
export const userPlantRepository = new UserPlantRepository()
export const treatmentRepository = new TreatmentRepository()