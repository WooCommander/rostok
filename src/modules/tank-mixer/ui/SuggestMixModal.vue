<script setup lang="ts">
import { ref, computed } from 'vue'
import FpButton from '@/design-system/components/FpButton.vue'
import FpCard from '@/design-system/components/FpCard.vue'
import FpInput from '@/design-system/components/FpInput.vue'
import FpMobilePicker from '@/design-system/components/FpMobilePicker.vue'
import type { ProductItem } from '@/modules/products'

const props = defineProps<{
    visible: boolean
    products: ProductItem[]
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'submit', data: { name: string, description: string, productIds: string[] }): void
}>()

const name = ref('')
const description = ref('')
const selectedProduct1 = ref<ProductItem | null>(null)
const selectedProduct2 = ref<ProductItem | null>(null)
const selectedProduct3 = ref<ProductItem | null>(null)

const pickerItems = computed(() => {
    return props.products.map(p => ({
        id: p.id,
        name: `${p.icon} ${p.name}`,
        originalProduct: p
    }))
})

const isValid = computed(() => {
    return name.value.trim().length > 0 &&
        selectedProduct1.value &&
        selectedProduct2.value
})

const close = () => {
    emit('update:visible', false)
}

const submit = () => {
    if (!isValid.value) return
    const ids = [selectedProduct1.value?.id, selectedProduct2.value?.id, selectedProduct3.value?.id].filter(Boolean) as string[]
    emit('submit', {
        name: name.value.trim(),
        description: description.value.trim(),
        productIds: ids
    })
    
    // Reset form
    name.value = ''
    description.value = ''
    selectedProduct1.value = null
    selectedProduct2.value = null
    selectedProduct3.value = null
}
</script>

<template>
    <Teleport to="body">
        <Transition name="fade">
            <div v-if="visible" class="modal-overlay" @click.self="close">
                <div class="modal-container">
                    <FpCard class="modal-card">
                        <div class="modal-header">
                            <h3>Предложить рецепт</h3>
                            <button class="close-btn" @click="close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <p class="subtitle">Ваш рецепт пройдет проверку или будет одобрен сообществом (нужно 3 голоса).</p>
                            
                            <div class="form-group">
                                <FpInput v-model="name" label="Название смеси" placeholder="Например: От тли на розах" />
                            </div>

                            <div class="form-group">
                                <FpMobilePicker
                                    :model-value="selectedProduct1 ? `${selectedProduct1.icon} ${selectedProduct1.name}` : ''"
                                    :items="pickerItems"
                                    label="Препарат 1"
                                    placeholder="Выберите первый препарат"
                                    variant="bordered"
                                    @select="(item: any) => selectedProduct1 = item.originalProduct"
                                />
                            </div>

                            <div class="form-group">
                                <FpMobilePicker
                                    :model-value="selectedProduct2 ? `${selectedProduct2.icon} ${selectedProduct2.name}` : ''"
                                    :items="pickerItems"
                                    label="Препарат 2"
                                    placeholder="Выберите второй препарат"
                                    variant="bordered"
                                    @select="(item: any) => selectedProduct2 = item.originalProduct"
                                />
                            </div>

                            <div class="form-group">
                                <FpMobilePicker
                                    :model-value="selectedProduct3 ? `${selectedProduct3.icon} ${selectedProduct3.name}` : ''"
                                    :items="pickerItems"
                                    label="Препарат 3 (необязательно)"
                                    placeholder="Выберите третий препарат"
                                    variant="bordered"
                                    @select="(item: any) => selectedProduct3 = item.originalProduct"
                                />
                            </div>

                            <div class="form-group">
                                <label class="textarea-label">Обоснование (почему работает?)</label>
                                <textarea v-model="description" class="custom-textarea" rows="3" placeholder="Кратко опишите действие смеси..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <FpButton variant="text" @click="close">Отмена</FpButton>
                            <FpButton variant="primary" :disabled="!isValid" @click="submit">Предложить</FpButton>
                        </div>
                    </FpCard>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped lang="scss">
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: color-mix(in srgb, var(--color-text-primary) 60%, transparent);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 16px;
}

.modal-container {
    width: 100%;
    max-width: 500px;
    animation: slideUp 0.3s ease-out;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
}

.modal-card {
    background: var(--color-surface);
    display: flex;
    flex-direction: column;
    max-height: 100%;
    overflow: hidden;
    padding: 0;
}

.modal-header {
    padding: 20px 20px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;

    h3 {
        margin: 0;
        font-size: var(--text-h3);
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        color: var(--color-text-tertiary);
        cursor: pointer;
        line-height: 1;
        
        &:hover {
            color: var(--color-text-primary);
        }
    }
}

.modal-body {
    padding: 0 20px 20px;
    overflow-y: auto;
    
    .subtitle {
        color: var(--color-text-secondary);
        font-size: 13px;
        margin-top: 0;
        margin-bottom: 20px;
    }
}

.form-group {
    margin-bottom: 16px;
}

.textarea-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-secondary);
    margin-bottom: 8px;
}

.custom-textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    background: var(--color-background);
    color: var(--color-text-primary);
    font-size: 16px;
    font-family: inherit;
    resize: vertical;
    transition: all 0.2s;

    &:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
    }
}

.modal-footer {
    padding: 16px 20px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    border-top: 1px solid var(--color-border);
    flex-shrink: 0;
}

// Transitions
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
