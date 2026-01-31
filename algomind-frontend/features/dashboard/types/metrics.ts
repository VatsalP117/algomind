// Types for metrics API responses

export type DashboardSummary = {
  due_count: number
  current_streak: number
  longest_streak: number
  reviews_today: number
  total_problems: number
}

export type RecallDataPoint = {
  date: string
  total_reviews: number
  successful_reviews: number
  recall_rate: number
}

export type TopicMastery = {
  concept_id: number
  concept_title: string
  problem_count: number
  avg_ease: number
  avg_interval: number
  retention_rate: number
  mastery_score: number
}
