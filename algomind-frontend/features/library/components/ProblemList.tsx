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
            case 'EASY': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none border-0';
            case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 shadow-none border-0';
            case 'HARD': return 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 shadow-none border-0';
            default: return 'bg-slate-500/10 text-slate-500';
        }
    };
    console.log('problems', problems[0].date_added)
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
                            <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground font-normal border-0">
                                {problem.tag}
                            </Badge>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end gap-3 text-sm text-muted-foreground w-full sm:w-auto">
                            <div className="flex items-center gap-1.5 whitespace-nowrap ml-auto sm:ml-0 text-xs">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Added {problem.date_added.split('T')[0]}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
