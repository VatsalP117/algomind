export type MasteryLabel =
    | 'Learning'
    | 'Developing'
    | 'Strong'
    | 'Needs practice'

export interface PatternInsight {
    pattern_id: number
    name: string
    confirmed_count: number
    due_count: number
    recognized_count: number
    partial_count: number
    missed_count: number
    attempts: number
    mastery_score: number | null
    label: MasteryLabel | null
    insight: string | null
}

export interface PatternEdge {
    source_pattern_id: number
    target_pattern_id: number
    shared_problem_count: number
}

export interface PatternInsightsResponse {
    patterns: PatternInsight[]
    edges: PatternEdge[]
}
