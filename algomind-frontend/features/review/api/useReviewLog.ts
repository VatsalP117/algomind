import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

// Map frontend numbers to Backend Enums
const RATING_MAP = {
    1: "AGAIN",
    2: "HARD",
    3: "GOOD",
    4: "EASY",
} as const;

type LogReviewInput = {
    entityId: number;
    rating: 1 | 2 | 3 | 4;
};

export const useLogReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ entityId, rating }: LogReviewInput) => {
            // Matches your curl: POST /api/v1/reviews/problem/:id/log
            const payload = { rating: RATING_MAP[rating] };

            const res = await api.post(`/reviews/problem/${entityId}/log`, payload);
            return res.data;
        },
        onSuccess: () => {
            // Optional: Refetch specific stats if you have a heatmap
            queryClient.invalidateQueries({ queryKey: ["stats"] });
        },
    });
};