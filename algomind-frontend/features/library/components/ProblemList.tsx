import { Problem } from '../api/useGetProblems';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface ProblemListProps {
    problems: Problem[];
    isLoading: boolean;
}

export function ProblemList({ problems, isLoading }: ProblemListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 w-full animate-pulse rounded-lg bg-muted" />
                ))}
            </div>
        );
    }

    if (problems.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground">No problems found matching your filters.</p>
            </div>
        );
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none border-0';
            case 'Medium': return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 shadow-none border-0';
            case 'Hard': return 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 shadow-none border-0';
            default: return 'bg-slate-500/10 text-slate-500';
        }
    };

    return (
        <div className="space-y-4">
            {problems.map((problem) => (
                <Card key={problem.id} className="transition-all hover:bg-muted/50 cursor-pointer">
                    <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-base sm:text-lg">{problem.title}</h3>
                                <Badge className={getDifficultyColor(problem.difficulty)}>
                                    {problem.difficulty}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {problem.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs bg-muted text-muted-foreground font-normal border-0">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end gap-3 text-sm text-muted-foreground w-full sm:w-auto">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span className="font-medium text-foreground">{problem.platform}</span>
                            </div>
                            <div className="flex items-center gap-1.5 whitespace-nowrap ml-auto sm:ml-0 text-xs">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Added {problem.dateAdded}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
