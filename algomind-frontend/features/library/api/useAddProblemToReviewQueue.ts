import { api } from "@/lib/api-client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useAddProblemToReviewQueue = () => {
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/problems/add-to-review-queue/${id}`);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Problem added to review queue successfully');
        },
        onError: () => {
            toast.error('Failed to add problem to review queue');
        }
    });
};
