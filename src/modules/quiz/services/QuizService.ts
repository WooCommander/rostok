import { AppService } from '@/services/AppService'

export const QuizService = {
  handleCorrectAnswer(questionId: number): void {
    const solvedRaw = localStorage.getItem('rostok_solved_questions')
    const solvedIds: number[] = solvedRaw ? JSON.parse(solvedRaw) : []
    
    if (!solvedIds.includes(questionId)) {
      solvedIds.push(questionId)
      localStorage.setItem('rostok_solved_questions', JSON.stringify(solvedIds))
      
      // Начисляем 10 XP через AppService (оркестрация)
      AppService.addXp(10)
    }
  }
}
