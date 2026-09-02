export type PatternRole = 'primary' | 'supporting'

export type PatternCardStatus = 'draft' | 'confirmed'

export interface PatternCardPattern {
    name: string
    role: PatternRole
    rationale: string
}

export type ProblemDifficulty = 'EASY' | 'MEDIUM' | 'HARD'

export interface RelatedProblem {
    id: number
    title: string
    difficulty: ProblemDifficulty
    shared_patterns: string[]
}

export interface PatternCard {
    problem_id: number
    status: PatternCardStatus
    patterns: PatternCardPattern[]
    recognition_cues: string[]
    invariant: string
    first_move: string
    common_mistake: string
    contrasting_pattern: string
    explanation: string
    model?: string | null
    created_at: string
    updated_at: string
    related_problems: RelatedProblem[]
}

export interface PatternCardUpdate {
    patterns: PatternCardPattern[]
    recognition_cues: string[]
    invariant: string
    first_move: string
    common_mistake: string
    contrasting_pattern: string
    explanation: string
}
