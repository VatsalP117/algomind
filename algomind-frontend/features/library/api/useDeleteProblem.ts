import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export const useDeleteProblem = () => {
    return useMutation({
        mutationFn: async (id: string) => {
            // Mock delete
            await new Promise((resolve) => setTimeout(resolve, 500));
            // const response = await api.delete(`/problems/${id}`);
            // return response.data;
            return true;
        },
        onSuccess: () => {
            toast.success('Problem deleted successfully');
        },
        onError: () => {
            toast.error('Failed to delete problem');
        }
    });
};
