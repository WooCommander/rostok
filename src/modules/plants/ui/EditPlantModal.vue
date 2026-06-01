<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Camera, UploadCloud, Trash2, Plus, History } from 'lucide-vue-next'
import FpButton from '@/design-system/components/FpButton.vue'
import FpInput from '@/design-system/components/FpInput.vue'
import FpNumberInput from '@/design-system/components/FpNumberInput.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import { PlantService, type UserPlant } from '../services/PlantService'

const router = useRouter()

interface Props {
  modelValue: boolean
  plantData: UserPlant | null
  saving: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', updates: Partial<UserPlant>): void
  (e: 'delete', id: string): void
  (e: 'add-instance', plantId?: string): void
  (e: 'open-timelapse'): void
  (e: 'photo-uploaded', url: string): void
}>()

const form = ref({
  nickname: '',
  location_note: '',
  planted_at: '',
  days_to_harvest: '' as string | number
})

const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadingPhoto = ref(false)
const showDeleteConfirm = ref(false)

watch(() => props.plantData, (newVal) => {
  if (newVal) {
    form.value = {
      nickname: newVal.nickname || '',
      location_note: newVal.location_note || '',
      planted_at: newVal.planted_at ? newVal.planted_at.split('T')[0] : '',
      days_to_harvest: newVal.days_to_harvest || ''
    }
  }
}, { immediate: true })

function close() {
  emit('update:modelValue', false)
}

function save() {
  emit('save', {
    nickname: form.value.nickname || null,
    location_note: form.value.location_note || null,
    planted_at: form.value.planted_at || null,
    days_to_harvest: form.value.days_to_harvest ? Number(form.value.days_to_harvest) : null
  })
}

function triggerPhotoSelect() {
  fileInputRef.value?.click()
}

async function onPhotoSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !props.plantData) return
  uploadingPhoto.value = true
  try {
    const url = await PlantService.uploadGardenPhoto(file, props.plantData.id)
    if (url) {
      emit('photo-uploaded', url)
    }
  } catch (err) {
    console.error('Ошибка загрузки фото:', err)
  } finally {
    uploadingPhoto.value = false
  }
}

function handleDelete() {
  if (!props.plantData) return
  emit('delete', props.plantData.id)
  showDeleteConfirm.value = false
}
</script>

<template>
  <div v-if="modelValue && plantData" class="modal-backdrop" @click="close">
    <div class="modal-box" @click.stop>
      <div class="modal-header">
        <h3>Настройка грядки</h3>
        <button class="close-btn" @click="close">✕</button>
      </div>
      <div class="modal-body">
        <div class="photo-field">
          <label>Фотография грядки / растения</label>
          <div class="photo-preview-box"
            :style="{ backgroundImage: plantData.photo_url ? `url(${plantData.photo_url})` : 'none' }">
            <div v-if="!plantData.photo_url" class="no-photo-placeholder">
              <Camera :size="28" />
              <span>Фото не добавлено</span>
            </div>
            <button class="upload-photo-btn" @click="triggerPhotoSelect" :disabled="uploadingPhoto || saving">
              <UploadCloud :size="18" />
              <span>{{ uploadingPhoto ? 'Загрузка...' : (plantData.photo_url ? 'Заменить фото' : 'Загрузить фото') }}</span>
            </button>
          </div>
          <button class="timeline-btn" @click="close(); router.push(`/garden/${plantData.id}`)">
            <History :size="16" />
            История грядки
          </button>
          <input type="file" accept="image/*" ref="fileInputRef" style="display:none" @change="onPhotoSelected" />
        </div>

        <FpInput v-model="form.nickname" label="Сорт / Название грядки" placeholder="Например: Бычье сердце, Черри..." class="mb-3" />
        <FpInput v-model="form.location_note" label="Где растёт" placeholder="Теплица №1, Южная клумба..." class="mb-3" />
        
        <div class="field mb-3">
          <label>Дата посадки</label>
          <input type="date" v-model="form.planted_at" class="modal-input" />
        </div>
        
        <FpNumberInput v-model="form.days_to_harvest" label="Дней до первого урожая (от посадки)" :min="1" class="mb-4" />

        <div class="modal-extra-actions">
          <button class="add-inst-btn" @click="emit('add-instance', plantData.plant_id)" :disabled="saving">
            <Plus :size="16" /> Добавить ещё одну грядку/сорт {{ plantData.plant?.name.toLowerCase() }}
          </button>
        </div>

        <div class="modal-actions">
          <FpButton variant="danger" @click="showDeleteConfirm = true" :disabled="saving">
            <Trash2 :size="18" /> Удалить
          </FpButton>
          <FpButton variant="primary" @click="save" :loading="saving">
            Сохранить
          </FpButton>
        </div>
      </div>
    </div>
  </div>

  <ConfirmDialog v-model="showDeleteConfirm" title="Удаление грядки"
    message="Вы уверены, что хотите удалить эту грядку/культуру из вашего огорода? Вся связанная с ней история и записи будут удалены."
    confirmText="Удалить" cancelText="Отмена" :isDanger="true" @confirm="handleDelete" />
</template>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(4px);
}
.modal-box {
  background: var(--color-background);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}
.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  display: flex; justify-content: space-between; align-items: center;
  h3 { margin: 0; font-size: 18px; font-weight: 700; color: var(--color-text-primary); }
  .close-btn { background: none; border: none; font-size: 20px; color: var(--color-text-tertiary); cursor: pointer; padding: 4px; }
}
.modal-body {
  padding: 20px;
  overflow-y: auto;
}
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }

.field label {
  display: block; font-size: 13px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 6px;
}
.modal-input {
  width: 100%; padding: 12px 14px; border: 1px solid var(--color-border);
  border-radius: var(--radius-md); background: var(--color-surface);
  font-size: 15px; color: var(--color-text-primary); outline: none; box-sizing: border-box;
  &:focus { border-color: var(--color-primary); }
}

.photo-field { margin-bottom: 20px; }
.photo-field label { display: block; font-size: 13px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 8px; }
.photo-preview-box {
  width: 100%; height: 180px; background-color: var(--color-surface); background-size: cover; background-position: center;
  border: 1px dashed var(--color-border); border-radius: var(--radius-lg);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  position: relative; overflow: hidden; margin-bottom: 12px;
}
.no-photo-placeholder {
  display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--color-text-tertiary); margin-bottom: 16px;
  span { font-size: 14px; font-weight: 500; }
}
.upload-photo-btn {
  position: absolute; bottom: 12px;
  background: rgba(0,0,0,0.6); color: white; border: none; padding: 8px 16px; border-radius: 99px;
  display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; cursor: pointer; backdrop-filter: blur(4px); transition: background 0.2s;
  &:hover:not(:disabled) { background: rgba(0,0,0,0.8); }
  &:disabled { opacity: 0.7; cursor: not-allowed; }
}
.timeline-btn {
  width: 100%; background: rgba(45, 106, 79, 0.08); border: 1px solid rgba(45, 106, 79, 0.25); padding: 11px;
  border-radius: var(--radius-md); font-size: 14px; font-weight: 600; color: var(--color-primary);
  cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px;
  &:hover { background: rgba(45, 106, 79, 0.15); border-color: var(--color-primary); }
}

.modal-extra-actions {
  margin-bottom: 24px; padding-top: 16px; border-top: 1px dashed var(--color-border);
}
.add-inst-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
  background: transparent; border: 1px dashed var(--color-primary); color: var(--color-primary);
  padding: 12px; border-radius: var(--radius-md); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s;
  &:hover:not(:disabled) { background: rgba(45, 106, 79, 0.05); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.modal-actions {
  display: flex; justify-content: space-between; gap: 12px;
  button { flex: 1; }
}
</style>
