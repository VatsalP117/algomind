import { create } from 'zustand';

export type ReviewProblem = {
    entity_id: number;
    entity_type: string;
    title: string;
    summary: string;
    difficulty: string;
    answer: string;
    hints: string;
};

type ReviewState = {
    queue: ReviewProblem[];
    currentIndex: number;
    isSessionComplete: boolean;

    // Actions
    initSession: (problems: ReviewProblem[]) => void;
    nextCard: () => void; // Simply moves the index forward
};

export const useReviewStore = create<ReviewState>((set, get) => ({
    queue: [],
    currentIndex: 0,
    isSessionComplete: false,

    initSession: (problems) => {
        set({
            queue: problems,
            currentIndex: 0,
            isSessionComplete: problems.length === 0
        });
    },

    nextCard: () => {
        const { queue, currentIndex } = get();
        const nextIndex = currentIndex + 1;

        if (nextIndex >= queue.length) {
            set({ isSessionComplete: true });
        } else {
            set({ currentIndex: nextIndex });
        }
    },
}));