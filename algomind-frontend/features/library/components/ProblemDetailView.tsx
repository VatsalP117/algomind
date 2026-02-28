'use client';

import { useGetProblemById } from '../api/useGetProblemById';
import { useDeleteProblem } from '../api/useDeleteProblem';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trash2, RotateCcw, ArrowLeft } from 'lucide-react';
import DifficultyBadge from './DifficultyBadge';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAddProblemToReviewQueue } from '../api/useAddProblemToReviewQueue';

interface ProblemDetailViewProps {
    id: string;
}

export function ProblemDetailView({ id }: ProblemDetailViewProps) {
    const router = useRouter();
    const { data: problem, isLoading } = useGetProblemById(id);
    const deleteMutation = useDeleteProblem();
    const addToReviewQueueMutation = useAddProblemToReviewQueue();

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-1/3 bg-muted rounded"></div>
                <div className="h-32 w-full bg-muted rounded"></div>
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-semibold">Problem not found</h3>
                <Button variant="link" onClick={() => router.back()}>Go back</Button>
            </div>
        );
    }

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this problem?")) {
            await deleteMutation.mutateAsync(id);
            router.push('/dashboard/library');
        }
    };

    const handleAddToReview = () => {
        addToReviewQueueMutation.mutate(id);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
                <div className="space-y-3">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-3 text-muted-foreground">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Library
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{problem.title}</h1>
                        <DifficultyBadge difficulty={problem.difficulty} />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Badge variant="outline" className="font-normal">{problem.tag}</Badge>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {problem.date_added.split('T')[0]}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleAddToReview}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Review
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Content Sections */}

            {problem.summary && (
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold">Summary</h2>
                    <p className="text-muted-foreground">{problem.summary}</p>
                </div>
            )}

            {problem.description && (
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold">Description</h2>
                    <div className="prose dark:prose-invert max-w-none text-muted-foreground bg-muted/30 p-4 rounded-lg">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {problem.description}
                        </ReactMarkdown>
                    </div>
                </div>
            )}

            {problem.hints && (
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold">Hints</h2>
                    <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 p-4 rounded-lg text-sm border border-amber-500/20">
                        {problem.hints}
                    </div>
                </div>
            )}

            {problem.answer && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">My Solution</h2>
                        {problem.answer_language && (
                            <Badge variant="secondary">{problem.answer_language}</Badge>
                        )}
                    </div>
                    <div className="prose dark:prose-invert max-w-none rounded-lg overflow-hidden border">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {problem.answer}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
}
