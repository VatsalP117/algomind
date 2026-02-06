'use client'

import { Settings, Wrench } from 'lucide-react'
import FeatureComingSoon from '@/components/shared/feature-coming-soon'

export default function EditConceptsPage() {
    return (
        <div className="min-h-screen">
            <div className="relative border-b">
                <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                                <Settings className="h-5 w-5" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
                                Edit Concepts
                            </h1>
                        </div>
                        <p className="text-muted-foreground max-w-2xl">
                            Manage and update your concept definitions.
                        </p>
                    </div>
                </div>
            </div>
            <FeatureComingSoon />
        </div>
    )
}
