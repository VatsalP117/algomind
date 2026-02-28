import { api } from '@/lib/api-client';
import { useAuthQuery } from '@/features/useAuthQuery';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Problem {
    id: string;
    title: string;
    difficulty: Difficulty;
    tag: string;
    date_added: string;
}

const mockProblems: Problem[] = [
    { id: '1', title: 'Two Sum', difficulty: 'EASY', tag: 'Array', date_added: '2023-10-01' },
    { id: '2', title: 'Add Two Numbers', difficulty: 'MEDIUM', tag: 'Linked List', date_added: '2023-10-02' },
    { id: '3', title: 'Longest Substring Without Repeating Characters', difficulty: 'MEDIUM', tag: 'Hash Table', date_added: '2023-10-03' },
    { id: '4', title: 'Median of Two Sorted Arrays', difficulty: 'HARD', tag: 'Array', date_added: '2023-10-04' },
    { id: '5', title: 'Valid Parentheses', difficulty: 'EASY', tag: 'String', date_added: '2023-10-05' },
    { id: '6', title: 'Merge Intervals', difficulty: 'MEDIUM', tag: 'Array', date_added: '2023-10-06' },
];

export const useGetProblems = () => {
    return useAuthQuery({
        queryKey: ['problems'],
        queryFn: async () => {
            const response = await api.get<Problem[]>('/problems');
            return response.data ?? [];
        },
    });
};
