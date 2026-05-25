<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { helpArticles } from '../data/helpData'
import { Search, TestTube, Sprout, ShieldAlert, RefreshCw, Leaf, Droplets, BookOpen } from 'lucide-vue-next'
import FpInput from '@/design-system/components/FpInput.vue'
import FpCard from '@/design-system/components/FpCard.vue'

const router = useRouter()
const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)

const categories = computed(() => {
    const cats = new Set(helpArticles.map(a => a.category))
    return Array.from(cats)
})

const filteredArticles = computed(() => {
    let result = helpArticles
    if (selectedCategory.value) {
        result = result.filter(a => a.category === selectedCategory.value)
    }
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        result = result.filter(a => 
            a.title.toLowerCase().includes(q) || 
            a.tags.some(t => t.toLowerCase().includes(q))
        )
    }
    return result
})

const selectCategory = (cat: string) => {
    if (selectedCategory.value === cat) {
        selectedCategory.value = null
    } else {
        selectedCategory.value = cat
    }
}

const openArticle = (id: string) => {
    router.push(`/help/${id}`)
}

const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
        TestTube,
        Sprout,
        ShieldAlert,
        RefreshCw,
        Leaf,
        Droplets,
        BookOpen
    }
    return icons[iconName] || BookOpen
}
</script>

<template>
    <div class="help-view">
        <div class="header">
            <div class="icon-wrap">
                <BookOpen :size="24" />
            </div>
            <h2>База знаний</h2>
            <p>Секреты урожая, агрономия и защита растений</p>
        </div>

        <div class="search-wrap">
            <FpInput 
                v-model="searchQuery" 
                placeholder="Поиск по статьям..." 
            />
            <Search class="search-icon" :size="20" />
        </div>

        <div class="categories">
            <button 
                class="category-chip" 
                :class="{ active: selectedCategory === null }"
                @click="selectedCategory = null"
            >
                Все
            </button>
            <button 
                v-for="cat in categories" 
                :key="cat"
                class="category-chip"
                :class="{ active: selectedCategory === cat }"
                @click="selectCategory(cat)"
            >
                {{ cat }}
            </button>
        </div>

        <div class="articles-grid">
            <FpCard 
                v-for="article in filteredArticles" 
                :key="article.id" 
                class="article-card"
                @click="openArticle(article.id)"
            >
                <div class="card-content">
                    <div class="icon-circle">
                        <component :is="getIcon(article.icon)" :size="20" />
                    </div>
                    <div class="text-content">
                        <h3>{{ article.title }}</h3>
                        <div class="tags">
                            <span v-for="tag in article.tags.slice(0,2)" :key="tag" class="tag">#{{ tag }}</span>
                        </div>
                    </div>
                </div>
            </FpCard>
            
            <div v-if="filteredArticles.length === 0" class="empty-state">
                <p>Ничего не найдено. Попробуйте изменить запрос.</p>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.help-view {
    padding: 16px;
    padding-bottom: 32px;
}

.header {
    text-align: center;
    margin-bottom: 24px;
    margin-top: 8px;

    .icon-wrap {
        width: 48px;
        height: 48px;
        background: var(--color-primary-subtle, rgba(45,106,79,0.2));
        color: var(--color-primary);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 12px;
    }

    h2 {
        font-size: 22px;
        font-weight: 700;
        margin: 0 0 8px;
        color: var(--color-text-primary);
    }

    p {
        font-size: 14px;
        color: var(--color-text-secondary);
        margin: 0;
    }
}

.search-wrap {
    position: relative;
    margin-bottom: 20px;

    .search-icon {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--color-text-tertiary);
        pointer-events: none;
    }
}

.categories {
    display: flex;
    overflow-x: auto;
    gap: 8px;
    margin-bottom: 24px;
    padding-bottom: 8px;
    scrollbar-width: none;
    &::-webkit-scrollbar {
        display: none;
    }
}

.category-chip {
    white-space: nowrap;
    padding: 8px 16px;
    border-radius: 999px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &.active {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
    }
}

.articles-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.article-card {
    cursor: pointer;
    transition: transform 0.15s;
    
    &:active {
        transform: scale(0.98);
    }
    
    .card-content {
        display: flex;
        align-items: center;
        gap: 16px;
    }
}

.icon-circle {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--color-background);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
    flex-shrink: 0;
}

.text-content {
    flex: 1;
    min-width: 0;
    
    h3 {
        margin: 0 0 6px;
        font-size: 15px;
        font-weight: 600;
        line-height: 1.3;
        color: var(--color-text-primary);
    }
}

.tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    
    .tag {
        font-size: 11px;
        color: var(--color-text-tertiary);
        background: var(--color-background);
        padding: 2px 6px;
        border-radius: 4px;
    }
}

.empty-state {
    text-align: center;
    padding: 32px 0;
    color: var(--color-text-tertiary);
    font-size: 14px;
}
</style>
