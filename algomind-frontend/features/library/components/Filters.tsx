import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Difficulty } from '../api/useGetProblems';

interface FiltersProps {
    search: string;
    setSearch: (s: string) => void;
    difficulty: Difficulty | 'All';
    setDifficulty: (d: Difficulty | 'All') => void;
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

            <Select value={difficulty} onValueChange={(val) => setDifficulty(val as Difficulty | 'All')}>
                <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
            </Select>

            <Select value={tag} onValueChange={setTag}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Tags" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Tags</SelectItem>
                    {availableTags.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
