import { Badge } from "@/components/ui/badge";

export default function DifficultyBadge({ difficulty }: { difficulty: string }) {
    const getStyles = (difficulty: string) => {
        switch (difficulty) {
            case 'EASY': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none border-0';
            case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 shadow-none border-0';
            case 'HARD': return 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 shadow-none border-0';
            default: return 'bg-slate-500/10 text-slate-500';
        }
    };
    return (
        <Badge className={getStyles(difficulty)}    >
            {difficulty}
        </Badge>
    );
}