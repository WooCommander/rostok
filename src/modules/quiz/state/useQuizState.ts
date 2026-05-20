import { ref, computed } from 'vue'
import { quizQuestions, type QuizQuestion } from '../data/quizQuestions'
import { QuizService } from '../services/QuizService'

const currentQuestionIdx = ref<number>(0)
const isAnswered = ref<boolean>(false)
const userAnswer = ref<boolean | null>(null)
const isAnimating = ref<boolean>(false)

export function useQuizState() {
  const currentQuestion = computed<QuizQuestion>(() => quizQuestions[currentQuestionIdx.value])
  const isUserCorrect = computed<boolean>(() => userAnswer.value === currentQuestion.value.isTrue)

  function answerQuestion(answer: boolean): void {
    if (isAnswered.value || isAnimating.value) return
    isAnimating.value = true
    userAnswer.value = answer
    
    if (answer === currentQuestion.value.isTrue) {
      QuizService.handleCorrectAnswer(currentQuestion.value.id)
    }
    
    setTimeout(() => {
      isAnswered.value = true
      isAnimating.value = false
    }, 250)
  }

  function nextQuestion(): void {
    if (isAnimating.value) return
    isAnimating.value = true
    
    setTimeout(() => {
      isAnswered.value = false
      userAnswer.value = null
      currentQuestionIdx.value = (currentQuestionIdx.value + 1) % quizQuestions.length
      isAnimating.value = false
    }, 250)
  }

  return {
    currentQuestionIdx,
    isAnswered,
    userAnswer,
    isAnimating,
    currentQuestion,
    isUserCorrect,
    answerQuestion,
    nextQuestion
  }
}
