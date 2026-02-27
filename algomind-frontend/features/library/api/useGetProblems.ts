import { useQuery } from '@tanstack/react-query';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Problem {
    id: string;
    title: string;
    difficulty: Difficulty;
    tags: string[];
    platform: string;
    dateAdded: string;
}

const mockProblems: Problem[] = [
    { id: '1', title: 'Two Sum', difficulty: 'Easy', tags: ['Array', 'Hash Table'], platform: 'LeetCode', dateAdded: '2023-10-01' },
    { id: '2', title: 'Add Two Numbers', difficulty: 'Medium', tags: ['Linked List', 'Math'], platform: 'LeetCode', dateAdded: '2023-10-02' },
    { id: '3', title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', tags: ['Hash Table', 'String', 'Sliding Window'], platform: 'LeetCode', dateAdded: '2023-10-03' },
    { id: '4', title: 'Median of Two Sorted Arrays', difficulty: 'Hard', tags: ['Array', 'Binary Search', 'Divide and Conquer'], platform: 'LeetCode', dateAdded: '2023-10-04' },
    { id: '5', title: 'Valid Parentheses', difficulty: 'Easy', tags: ['String', 'Stack'], platform: 'LeetCode', dateAdded: '2023-10-05' },
    { id: '6', title: 'Merge Intervals', difficulty: 'Medium', tags: ['Array', 'Sorting'], platform: 'LeetCode', dateAdded: '2023-10-06' },
];

export const useGetProblems = () => {
    return useQuery({
        queryKey: ['problems'],
        queryFn: async () => {
            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 500));
            return mockProblems;
        },
    });
};
