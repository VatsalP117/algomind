'use client';

import { useState, useMemo } from 'react';
import { useGetProblems, Difficulty } from '../api/useGetProblems';
import { Filters } from './Filters';
import { ProblemList } from './ProblemList';

export function LibraryView() {
    const { data: problems = [], isLoading } = useGetProblems();

    const [search, setSearch] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty | 'All'>('All');
    const [tag, setTag] = useState<string>('All');

    // Extract all unique tags for the filter dropdown
    const availableTags = useMemo(() => {
        const tags = new Set<string>();
        problems.forEach(p => p.tags.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [problems]);

    // Derived state determining the filtered items
    const filteredProblems = useMemo(() => {
        return problems.filter(problem => {
            const matchesSearch = problem.title.toLowerCase().includes(search.toLowerCase());
            const matchesDifficulty = difficulty === 'All' || problem.difficulty === difficulty;
            const matchesTag = tag === 'All' || problem.tags.includes(tag);

            return matchesSearch && matchesDifficulty && matchesTag;
        });
    }, [problems, search, difficulty, tag]);

    return (
        <div className="w-full">
            <Filters
                search={search}
                setSearch={setSearch}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                tag={tag}
                setTag={setTag}
                availableTags={availableTags}
            />

            <ProblemList
                problems={filteredProblems}
                isLoading={isLoading}
            />
        </div>
    );
}
