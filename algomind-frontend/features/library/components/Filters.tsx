import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Difficulty } from '../api/useGetProblems';

interface FiltersProps {
    search: string;
    setSearch: (s: string) => void;
    difficulty: Difficulty | 'ALL';
    setDifficulty: (d: Difficulty | 'ALL') => void;
    tag: string;
    setTag: (t: string) => void;
    availableTags: string[];
}

export function Filters({ search, setSearch, difficulty, setDifficulty, tag, setTag, availableTags }: FiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search problems..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            <Select value={difficulty} onValueChange={(val) => setDifficulty(val as Difficulty | 'ALL')}>
                <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
            </Select>

            <Select value={tag} onValueChange={setTag}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Tags" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Tags</SelectItem>
                    {availableTags.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
