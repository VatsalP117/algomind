import { api } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { Problem } from './useGetProblems';

export interface ProblemDetail extends Problem {
    description?: string;
    answer?: string;
    answer_language?: string;
    summary?: string;
    hints?: string;
}

const mockProblemDetail: ProblemDetail = {
    id: '1',
    title: 'Two Sum',
    difficulty: 'EASY',
    tag: 'Array',
    date_added: '2023-10-01T00:00:00Z',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    summary: 'Find two numbers in an array that sum up to a target value.',
    answer: '```python\nclass Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        prevMap = {} # val : index\n\n        for i, n in enumerate(nums):\n            diff = target - n\n            if diff in prevMap:\n                return [prevMap[diff], i]\n            prevMap[n] = i\n        return\n```',
    answer_language: 'Python',
    hints: 'Try using a HashMap to store the numbers you have seen so far.',
};

export const useGetProblemById = (id: string) => {
    return useQuery({
        queryKey: ['problem', id],
        queryFn: async () => {
            // Simulate API interaction for now over picking real ID
            if (id === '1' || process.env.NODE_ENV === "development") {
                await new Promise((resolve) => setTimeout(resolve, 500));
                return { ...mockProblemDetail, id };
            }

            const response = await api.get<ProblemDetail>(`/problems/${id}`);
            return response.data;
        },
    });
};
