import { api } from '@/lib/api-client';
import { useAuthQuery } from '@/features/useAuthQuery';
import { Problem } from './useGetProblems';

export interface ProblemDetail extends Problem {
    description: string;
    answer: string;
    answer_language?: string;
    summary?: string;
    hints?: string;
}


export const useGetProblemById = (id: string) => {
    return useAuthQuery({
        queryKey: ['problem', id],
        queryFn: async () => {
            const response = await api.get<ProblemDetail>(`/problems/${id}`);
            return response.data;
        },
    });
};
