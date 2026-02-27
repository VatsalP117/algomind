import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { LandingNav } from '@/components/shared/landing-nav'

export const metadata: Metadata = {
    title: 'Coding Interview Retention Resources',
    description:
        'Free resources on spaced repetition, LeetCode review systems, and long-term algorithm retention.',
    alternates: {
        canonical: '/resources',
    },
}

const guides = [
    {
        title: 'Spaced Repetition for Coding Interviews',
        description:
            'Understand the forgetting curve and how interval reviews improve algorithm recall.',
        href: '/resources/spaced-repetition-coding-interviews',
    },
    {
        title: 'LeetCode Spaced Repetition Guide',
        description:
            'A practical daily system to retain solved LeetCode problems for interviews.',
        href: '/resources/leetcode-spaced-repetition-guide',
    },
]

export default function ResourcesPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <LandingNav />
            <main className="mx-auto max-w-5xl px-6 pb-24 pt-32">
                <div className="text-center">
                    <Badge variant="outline" className="mb-4">
                        Resources
                    </Badge>
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                        Algorithm interview retention resources
                    </h1>
                    <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
                        Detailed guides to help you build a reliable spaced repetition
                        workflow for coding interviews.
                    </p>
                </div>

                <section className="mt-14 grid gap-6 md:grid-cols-2">
                    {guides.map((guide) => (
                        <Link
                            key={guide.href}
                            href={guide.href}
                            className="rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-sm"
                        >
                            <h2 className="text-xl font-semibold">{guide.title}</h2>
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                {guide.description}
                            </p>
                        </Link>
                    ))}
                </section>

                <div className="mt-12 text-center">
                    <Link href="/" className="text-sm font-medium text-primary hover:underline">
                        Back to Algomind homepage
                    </Link>
                </div>
            </main>
        </div>
    )
}
