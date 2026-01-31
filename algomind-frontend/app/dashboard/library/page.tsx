'use client'

import { Library, FolderOpen } from 'lucide-react'

export default function LibraryPage() {
    return (
        <div className="min-h-screen">
            {/* Hero Header */}
            <div className="relative border-b">
                <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                                <Library className="h-5 w-5" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
                                Library
                            </h1>
                        </div>
                        <p className="text-muted-foreground max-w-2xl">
                            Browse and manage all your tracked problems.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content - Empty State */}
            <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
                <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed py-16">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <FolderOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-medium">Coming Soon</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            The library feature is under development.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
