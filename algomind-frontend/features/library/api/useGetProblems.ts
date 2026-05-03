import { useAuthQuery } from '@/features/useAuthQuery';
import { api } from '@/lib/api-client';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Problem {
    id: string;
    title: string;
    difficulty: Difficulty;
    tag: string;
    date_added: string;
}

export const useGetProblems = () => {
    return useAuthQuery({
        queryKey: ['problems'],
        queryFn: async () => {
            const response = await api.get<Problem[]>('/problems');
            return response.data ?? [];
        },
    });
};
