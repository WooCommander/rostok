<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'
import { useQuizState } from '../state/useQuizState'

const {
  isAnswered,
  isAnimating,
  currentQuestion,
  isUserCorrect,
  answerQuestion,
  nextQuestion
} = useQuizState()
</script>

<template>
  <section class="section quiz-section">
    <div class="section-title">
      <Sparkles :size="16" />
      Агро-квиз «Правда или Миф»
    </div>

    <div class="quiz-container" :class="{ 'is-turning': isAnimating, 'is-flipped': isAnswered }">
      <div class="quiz-card-flipper">
        
        <!-- Передняя сторона (Вопрос) -->
        <div v-if="!isAnswered" class="quiz-card-side front-side">
          <div class="quiz-header">
            <span class="quiz-badge">{{ currentQuestion.category }}</span>
            <span class="quiz-emoji-avatar">{{ currentQuestion.emoji }}</span>
          </div>
          <p class="quiz-question-text">{{ currentQuestion.question }}</p>
          <div class="quiz-actions">
            <button class="quiz-btn myth" @click="answerQuestion(false)">
              ❌ Миф
            </button>
            <button class="quiz-btn truth" @click="answerQuestion(true)">
              ✅ Правда
            </button>
          </div>
        </div>

        <!-- Обратная сторона (Объяснение) -->
        <div v-else class="quiz-card-side back-side">
          <div class="quiz-header">
            <div class="result-badge-row">
              <span 
                class="quiz-result-badge" 
                :class="{ correct: isUserCorrect, incorrect: !isUserCorrect }"
              >
                {{ isUserCorrect ? '🎉 Верно!' : '😢 Ошибка' }}
              </span>
              <span v-if="isUserCorrect" class="quiz-xp-badge">✨ +10 XP</span>
            </div>
            <span class="quiz-correct-answer">
              Ответ: <strong>{{ currentQuestion.isTrue ? 'Правда' : 'Миф' }}</strong>
            </span>
          </div>
          <p class="quiz-explanation-text">{{ currentQuestion.explanation }}</p>
          <button class="quiz-next-btn" @click="nextQuestion">
            Следующий вопрос ➔
          </button>
        </div>

      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.section {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
  margin-bottom: 10px;
}

.quiz-section {
  margin-top: 4px;
}

.quiz-container {
  width: 100%;
  perspective: 1000px;
  min-height: 190px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.3s;
  overflow: hidden;

  &.is-turning {
    transform: scale(0.96) rotateY(15deg);
  }

  &.is-flipped {
    border-color: var(--color-border);
  }
}

.quiz-card-flipper {
  width: 100%;
  height: 100%;
  padding: 18px 20px;
}

.quiz-card-side {
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: fadeInQuiz 0.3s ease-in-out;
}

@keyframes fadeInQuiz {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-badge-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.quiz-badge {
  font-size: 11px;
  font-weight: 800;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(45, 106, 79, 0.08);
  padding: 4px 10px;
  border-radius: 20px;
}

.quiz-emoji-avatar {
  font-size: 20px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
}

.quiz-question-text {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.45;
  margin: 0;
  text-align: left;
}

.quiz-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 4px;
}

.quiz-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  transition: all 0.2s;

  &.myth {
    color: var(--color-error);
    &:active {
      background: color-mix(in srgb, var(--color-error) 8%, transparent);
      border-color: var(--color-error);
      transform: scale(0.97);
    }
  }

  &.truth {
    color: var(--color-primary);
    &:active {
      background: rgba(45, 106, 79, 0.08);
      border-color: var(--color-primary);
      transform: scale(0.97);
    }
  }
}

.quiz-result-badge {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  border-radius: 20px;

  &.correct {
    background: rgba(45, 106, 79, 0.1);
    color: var(--color-primary);
  }

  &.incorrect {
    background: rgba(220, 38, 38, 0.1);
    color: var(--color-error);
  }
}

.quiz-xp-badge {
  font-size: 11px;
  font-weight: 800;
  color: #d97706;
  background: rgba(217, 119, 6, 0.08);
  padding: 4px 8px;
  border-radius: 12px;
}

.quiz-correct-answer {
  font-size: 12px;
  color: var(--color-text-secondary);
  strong {
    color: var(--color-text-primary);
    font-weight: 700;
  }
}

.quiz-explanation-text {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
  text-align: left;
}

.quiz-next-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: var(--radius-lg);
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 4px;

  &:active {
    transform: scale(0.97);
    background: color-mix(in srgb, var(--color-primary) 90%, black);
  }
}
</style>
