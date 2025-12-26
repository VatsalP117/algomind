'use client'

import ReactMarkdown from 'react-markdown'
import { useConcepts } from '@/features/edit-concepts/api/useConcepts' // Ensure this path matches where you put the hook
import { Loader2, AlertCircle } from 'lucide-react'

export default function ConceptsListPage() {
    const { data: concepts, isError } = useConcepts()

    if (isError || !concepts) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex h-96 items-center justify-center text-red-500">
                <AlertCircle className="mr-2 h-5 w-5" />
                <span>Failed to load concepts. Is the backend running?</span>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Core Concepts
                </h1>
                <p className="text-gray-500">
                    Your knowledge base of algorithms and data structures.
                </p>
            </div>

            <div className="grid gap-6">
                {concepts?.map((concept) => (
                    <article
                        key={concept.id}
                        className="bg-white dark:bg-gray-900 border rounded-xl shadow-sm overflow-hidden"
                    >
                        {/* Header Section */}
                        <div className="border-b bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                {concept.title}
                            </h2>
                            {/* If you have a description field, render it here */}
                            {/* <p className="text-sm text-gray-500 mt-1">{concept.description}</p> */}
                        </div>

                        {/* Markdown Content Section */}
                        <div className="p-6">
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <ReactMarkdown>{concept.content}</ReactMarkdown>
                            </div>
                        </div>
                    </article>
                ))}

                {concepts?.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No concepts found. Use the Admin page to add one.
                    </div>
                )}
            </div>
        </div>
    )
}
