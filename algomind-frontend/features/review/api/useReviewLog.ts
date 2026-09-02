import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

// Map frontend numbers to Backend Enums
const RATING_MAP = {
    1: "AGAIN",
    2: "HARD",
    3: "GOOD",
    4: "EASY",
} as const;

export type PatternRecognition = 'recognized' | 'partial' | 'missed';

type LogReviewInput = {
    entityId: number;
    rating: 1 | 2 | 3 | 4;
    patternGuess?: string;
    patternRecognition?: PatternRecognition;
};

export const useLogReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            entityId,
            rating,
            patternGuess,
            patternRecognition,
        }: LogReviewInput) => {
            const payload: Record<string, unknown> = {
                rating: RATING_MAP[rating],
            };
            if (patternGuess !== undefined) {
                payload.pattern_guess = patternGuess;
            }
            if (patternRecognition !== undefined) {
                payload.pattern_recognition = patternRecognition;
            }

            const res = await api.post(
                `/reviews/problem/${entityId}/log`,
                payload
            );
            return res.data;
        },
        onSuccess: () => {
            // Invalidate metrics and review queue after logging a review
            queryClient.invalidateQueries({ queryKey: ["metrics"] });
            queryClient.invalidateQueries({ queryKey: ["review-problems"] });
        },
    });
};