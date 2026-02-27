import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { LandingNav } from '@/components/shared/landing-nav'
import { siteConfig } from '@/lib/seo'

export const metadata: Metadata = {
    title: 'LeetCode Spaced Repetition Guide',
    description:
        'A step-by-step LeetCode spaced repetition system to retain solved problems and improve interview recall.',
    alternates: {
        canonical: '/resources/leetcode-spaced-repetition-guide',
    },
}

const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'LeetCode Spaced Repetition Guide',
    description:
        'Build a sustainable daily LeetCode review routine that improves long-term recall.',
    inLanguage: 'en-US',
    mainEntityOfPage: `${siteConfig.url}/resources/leetcode-spaced-repetition-guide`,
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
            name: 'LeetCode Spaced Repetition Guide',
            item: `${siteConfig.url}/resources/leetcode-spaced-repetition-guide`,
        },
    ],
}

export default function LeetCodeSpacedRepetitionGuidePage() {
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
                    LeetCode spaced repetition guide
                </h1>
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                    This workflow helps you stop re-solving old problems from scratch. You
                    will maintain a compact review queue that targets exactly what your brain
                    is about to forget.
                </p>

                <section className="mt-10 space-y-4">
                    <h2 className="text-2xl font-semibold">Step 1: Capture useful metadata</h2>
                    <p className="leading-relaxed text-muted-foreground">
                        For each solved problem, store difficulty, pattern, and a short note
                        on the key trick. Keep notes concise enough to review in under a minute.
                    </p>
                </section>

                <section className="mt-10 space-y-4">
                    <h2 className="text-2xl font-semibold">Step 2: Review with active recall</h2>
                    <p className="leading-relaxed text-muted-foreground">
                        Hide your old code first. Reconstruct the approach from memory, then
                        compare with your original solution. This exposes memory gaps fast.
                    </p>
                </section>

                <section className="mt-10 space-y-4">
                    <h2 className="text-2xl font-semibold">Step 3: Use adaptive intervals</h2>
                    <p className="leading-relaxed text-muted-foreground">
                        If recall is weak, schedule the next review sooner. If recall is
                        strong, push it further out. Adaptive intervals prevent both over-review
                        and forgetting.
                    </p>
                </section>

                <section className="mt-10 space-y-4">
                    <h2 className="text-2xl font-semibold">Step 4: Build weekly topic balance</h2>
                    <p className="leading-relaxed text-muted-foreground">
                        Ensure the queue covers arrays, trees, graphs, and DP each week so
                        interview preparation stays broad and not skewed toward favorite topics.
                    </p>
                </section>

                <section className="mt-12 rounded-2xl border border-border bg-muted/30 p-6">
                    <h2 className="text-xl font-semibold">Related resources</h2>
                    <div className="mt-4 flex flex-col gap-2 text-sm">
                        <Link
                            href="/resources/spaced-repetition-coding-interviews"
                            className="text-primary hover:underline"
                        >
                            Spaced repetition for coding interviews
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
