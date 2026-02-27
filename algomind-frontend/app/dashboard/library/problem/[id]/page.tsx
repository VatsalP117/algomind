'use client';

import { useParams } from 'next/navigation';
import { ProblemDetailView } from '@/features/library/components/ProblemDetailView';

export default function ProblemPage() {
    const params = useParams();
    const id = params.id as string;

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                <ProblemDetailView id={id} />
            </div>
        </div>
    );
}
