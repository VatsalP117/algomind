import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export const useDeleteProblem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/problems/${id}`);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Problem deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['problems'] });
        },
        onError: () => {
            toast.error('Failed to delete problem');
        }
    });
};
