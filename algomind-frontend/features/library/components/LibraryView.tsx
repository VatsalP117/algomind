'use client';

import { useState, useMemo } from 'react';
import { useGetProblems, Difficulty } from '../api/useGetProblems';
import { Filters } from './Filters';
import { ProblemList } from './ProblemList';

export function LibraryView() {
    const { data: problems = [], isLoading } = useGetProblems();

    const [search, setSearch] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty | 'ALL'>('ALL');
    const [tag, setTag] = useState<string>('ALL');

    const availableTags = useMemo(() => {
        const tags = new Set<string>();
        problems.forEach(p => tags.add(p.tag));
        return Array.from(tags).sort();
    }, [problems])
    const filteredProblems = useMemo(() => {
        return problems.filter(problem => {
            const matchesSearch = problem.title.toLowerCase().includes(search.toLowerCase());
            const matchesDifficulty = difficulty === 'ALL' || problem.difficulty === difficulty;
            const matchesTag = tag === 'ALL' || problem.tag === tag;
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
