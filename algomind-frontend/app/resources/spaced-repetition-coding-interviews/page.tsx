import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { LandingNav } from '@/components/shared/landing-nav'
import { siteConfig } from '@/lib/seo'

export const metadata: Metadata = {
    title: 'Spaced Repetition for Coding Interviews',
    description:
        'Learn how to use spaced repetition for coding interviews and retain algorithm patterns over the long term.',
    alternates: {
        canonical: '/resources/spaced-repetition-coding-interviews',
    },
}

const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Spaced Repetition for Coding Interviews',
    description:
        'A practical framework for retaining algorithms and data structure patterns with interval-based review.',
    inLanguage: 'en-US',
    mainEntityOfPage: `${siteConfig.url}/resources/spaced-repetition-coding-interviews`,
    author: {
        '@type': 'Organization',
        name: siteConfig.name,
    },
    publisher: {
        '@type': 'Organization',
        name: siteConfig.name,
    },
}

const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
        {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteConfig.url,
        },
        {
            '@type': 'ListItem',
            position: 2,
            name: 'Resources',
            item: `${siteConfig.url}/resources`,
        },
        {
            '@type': 'ListItem',
            position: 3,
            name: 'Spaced Repetition for Coding Interviews',
            item: `${siteConfig.url}/resources/spaced-repetition-coding-interviews`,
        },
    ],
}

export default function SpacedRepetitionCodingInterviewsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <LandingNav />
            <main className="mx-auto max-w-4xl px-6 pb-24 pt-32">
                <Badge variant="outline" className="mb-4">
                    Guide
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                    Spaced repetition for coding interviews
                </h1>
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                    Solving many problems does not guarantee recall under interview pressure.
                    Spaced repetition helps you retain algorithms by reviewing them at the
                    highest-leverage moment, right before forgetting.
                </p>

                <section className="mt-10 space-y-4">
                    <h2 className="text-2xl font-semibold">Why this works</h2>
                    <p className="leading-relaxed text-muted-foreground">
                        The forgetting curve predicts rapid decay after learning. Each spaced
                        review resets memory strength and extends the next review interval,
                        creating durable retention with less total time.
                    </p>
                </section>

                <section className="mt-10 space-y-4">
                    <h2 className="text-2xl font-semibold">Interview-focused review loop</h2>
                    <ol className="list-decimal space-y-3 pl-5 text-muted-foreground">
                        <li>Track each solved problem with the underlying pattern.</li>
                        <li>Review due problems daily and explain the approach from memory.</li>
                        <li>Rate recall quality honestly (Again, Hard, Good, Easy).</li>
                        <li>Let interval scheduling prioritize weaker memory traces.</li>
                    </ol>
                </section>

                <section className="mt-10 space-y-4">
                    <h2 className="text-2xl font-semibold">What to review</h2>
                    <p className="leading-relaxed text-muted-foreground">
                        Focus on high-frequency interview patterns: sliding window, binary
                        search variants, DFS/BFS templates, two pointers, heaps, and dynamic
                        programming state transitions.
                    </p>
                </section>

                <section className="mt-12 rounded-2xl border border-border bg-muted/30 p-6">
                    <h2 className="text-xl font-semibold">Related resources</h2>
                    <div className="mt-4 flex flex-col gap-2 text-sm">
                        <Link
                            href="/resources/leetcode-spaced-repetition-guide"
                            className="text-primary hover:underline"
                        >
                            LeetCode spaced repetition guide
                        </Link>
                        <Link href="/resources" className="text-primary hover:underline">
                            All resources
                        </Link>
                        <Link href="/" className="text-primary hover:underline">
                            Algomind homepage
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    )
}
