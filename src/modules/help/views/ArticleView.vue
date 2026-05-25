<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { helpArticles } from '../data/helpData'
import { Share2, BookMarked, TestTube, Sprout, ShieldAlert, RefreshCw, Leaf, Droplets, BookOpen } from 'lucide-vue-next'
import FpBackButton from '@/design-system/components/FpBackButton.vue'

const route = useRoute()
const router = useRouter()

const articleId = computed(() => route.params.id as string)
const article = computed(() => helpArticles.find(a => a.id === articleId.value))

const isSaved = ref(false)

const getIcon = (iconName?: string) => {
    if (!iconName) return BookOpen
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

const toggleSave = () => {
    // В будущем тут будет логика сохранения в UserPreferences
    isSaved.value = !isSaved.value
}

const shareArticle = () => {
    if (navigator.share && article.value) {
        navigator.share({
            title: article.value.title,
            text: 'Полезный совет из приложения Rostok',
            url: window.location.href
        }).catch(console.error)
    }
}
</script>

<template>
    <div v-if="article" class="article-view">
        <div class="header">
            <FpBackButton @click="router.back()" />
            <div class="actions">
                <button class="action-btn" @click="shareArticle">
                    <Share2 :size="20" />
                </button>
                <button class="action-btn" :class="{ saved: isSaved }" @click="toggleSave">
                    <BookMarked :size="20" :fill="isSaved ? 'currentColor' : 'none'" />
                </button>
            </div>
        </div>

        <div class="content-wrap">
            <div class="title-section">
                <div class="category-badge">
                    <component :is="getIcon(article.icon)" :size="14" />
                    {{ article.category }}
                </div>
                <h1>{{ article.title }}</h1>
            </div>

            <div class="html-content" v-html="article.content"></div>
        </div>
    </div>
    
    <div v-else class="not-found">
        <p>Статья не найдена</p>
        <button @click="router.back()">Вернуться назад</button>
    </div>
</template>

<style scoped lang="scss">
.article-view {
    padding-bottom: 40px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    position: sticky;
    top: env(safe-area-inset-top, 0px);
    background: var(--color-background);
    z-index: 10;
}

.actions {
    display: flex;
    gap: 12px;
}

.action-btn {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: var(--color-surface-hover);
        color: var(--color-text-primary);
    }
    
    &.saved {
        color: var(--color-primary);
        border-color: var(--color-primary);
        background: color-mix(in srgb, var(--color-primary) 10%, transparent);
    }
}

.content-wrap {
    padding: 0 20px;
}

.title-section {
    margin-bottom: 24px;
    
    .category-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: color-mix(in srgb, var(--color-primary) 15%, transparent);
        color: var(--color-primary);
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 12px;
    }
    
    h1 {
        font-size: 24px;
        font-weight: 800;
        line-height: 1.25;
        color: var(--color-text-primary);
        margin: 0;
    }
}

.html-content {
    color: var(--color-text-secondary);
    font-size: 16px;
    line-height: 1.6;
    
    :deep(h3) {
        color: var(--color-text-primary);
        font-size: 18px;
        font-weight: 700;
        margin: 24px 0 12px;
    }
    
    :deep(p) {
        margin-bottom: 16px;
    }
    
    :deep(ul), :deep(ol) {
        margin-bottom: 20px;
        padding-left: 20px;
        
        li {
            margin-bottom: 8px;
            
            b {
                color: var(--color-text-primary);
            }
        }
    }
    
    :deep(b) {
        color: var(--color-text-primary);
    }
}

.not-found {
    text-align: center;
    padding: 60px 20px;
    
    p {
        font-size: 18px;
        color: var(--color-text-secondary);
        margin-bottom: 20px;
    }
    
    button {
        padding: 10px 20px;
        background: var(--color-primary);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
    }
}
</style>
