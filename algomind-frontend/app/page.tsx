import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, BookOpen, Zap, BarChart3, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import { LandingNav } from '@/components/shared/landing-nav'
import { ForgettingCurveChart } from '@/components/shared/forgetting-curve-chart'
import { HeroCTA } from '@/components/shared/hero-cta'


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center">
        {/* Background grid */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.08),transparent)]" />

        <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1 text-xs">
          <Zap className="h-3 w-3" />
          Science-backed algorithm learning
        </Badge>

        <h1 className="max-w-4xl text-5xl font-bold tracking-tight lg:text-7xl">
          Stop forgetting what
          <br />
          <span className="text-muted-foreground">you already learned</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Algomind uses spaced repetition — the same technique used by memory champions — to make sure algorithms and data structures stick in your long-term memory, not just for the next interview.
        </p>

        <HeroCTA />

        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          {[
            'No daily streaks to maintain',
            'LeetCode auto-import',
            'Reviews take < 5 min/day',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* The Problem: Forgetting Curve */}
      <section className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge variant="outline" className="mb-4">The Science</Badge>
              <h2 className="text-4xl font-bold tracking-tight">
                Your brain is designed to forget
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                In 1885, Hermann Ebbinghaus discovered the <strong className="text-foreground">Forgetting Curve</strong>: without reinforcement, we forget ~50% of new information within an hour, and ~70% within 24 hours.
              </p>
              <p className="mt-4 text-muted-foreground">
                You can grind 200 LeetCode problems and still blank on a binary search during an interview — not because you're bad at algorithms, but because your brain naturally discards information it doesn't see repeatedly.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  { time: '1 hour later', retention: '58%', width: '58%' },
                  { time: '1 day later', retention: '33%', width: '33%' },
                  { time: '1 week later', retention: '19%', width: '19%' },
                  { time: '1 month later', retention: '8%', width: '8%' },
                ].map(({ time, retention, width }) => (
                  <div key={time} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{time}</span>
                      <span className="font-medium">{retention} retained</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-destructive/70 transition-all"
                        style={{ width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ForgettingCurveChart />

          </div>
        </div>
      </section>

      {/* The Solution: Spaced Repetition */}
      <section className="border-t border-border bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            {/* SR intervals diagram */}
            <div className="order-2 rounded-2xl border border-border bg-card p-6 lg:order-1">
              <p className="mb-6 text-sm font-medium text-muted-foreground">Memory retention with spaced repetition</p>
              <div className="space-y-4">
                {[
                  { label: 'Learn', day: 'Day 0', color: 'bg-primary', width: '100%' },
                  { label: 'Review 1', day: 'Day 1', color: 'bg-primary', width: '100%' },
                  { label: 'Review 2', day: 'Day 3', color: 'bg-primary', width: '100%' },
                  { label: 'Review 3', day: 'Day 7', color: 'bg-primary', width: '100%' },
                  { label: 'Review 4', day: 'Day 21', color: 'bg-primary', width: '100%' },
                ].map(({ label, day, color, width }, i) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="w-20 shrink-0 text-right text-xs text-muted-foreground">{day}</div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium">{label}</span>
                        <span className="text-muted-foreground">~100% retained</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${color} transition-all`}
                          style={{ width, opacity: 1 - i * 0.05 }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <p className="pt-2 text-center text-xs text-muted-foreground">Intervals grow exponentially — reviews become less frequent over time</p>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <Badge variant="outline" className="mb-4">The Solution</Badge>
              <h2 className="text-4xl font-bold tracking-tight">
                Review at the exact moment you're about to forget
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                <strong className="text-foreground">Spaced repetition</strong> schedules reviews at increasing intervals — right before your memory fades. Each review resets the forgetting curve at a higher baseline.
              </p>
              <p className="mt-4 text-muted-foreground">
                The SM-2 algorithm (used by Anki, Duolingo, and medical schools worldwide) adapts to how well you know each concept. Easy problems get pushed further out. Hard ones come back sooner.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { icon: Clock, label: '< 5 min', sub: 'daily review time' },
                  { icon: TrendingUp, label: '90%+', sub: 'long-term retention' },
                  { icon: BarChart3, label: 'Adaptive', sub: 'to your memory' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="rounded-xl border border-border bg-background p-4 text-center">
                    <Icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                    <div className="text-lg font-bold">{label}</div>
                    <div className="text-xs text-muted-foreground">{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-4xl font-bold tracking-tight">
              Powerful, without the friction
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We handle the scheduling. You just focus on understanding.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'LeetCode auto-import',
                description: 'Paste a LeetCode URL and we automatically pull the problem title, difficulty, and description. No manual entry.',
              },
              {
                icon: BookOpen,
                title: 'Concept library',
                description: 'Browse curated notes on every major algorithm and data structure — BFS, DP, segment trees, and more — all in one place.',
              },
              {
                icon: Brain,
                title: 'Smart review queue',
                description: 'Each morning, your queue shows exactly which problems are due for review based on the SM-2 spaced repetition algorithm.',
              },
              {
                icon: BarChart3,
                title: 'Progress dashboard',
                description: 'See your review streak, problems mastered, and upcoming reviews at a glance. Know exactly where you stand.',
              },
              {
                icon: CheckCircle,
                title: 'Honest self-rating',
                description: 'Rate each review as Again, Hard, Good, or Easy. The algorithm adjusts your next review interval accordingly.',
              },
              {
                icon: Clock,
                title: 'Minimal time commitment',
                description: 'Spaced repetition is efficient by design. Most users spend under 5 minutes per day maintaining their entire problem set.',
              },
            ].map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-muted/30 px-6 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight">
            Ready to actually remember what you learn?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join Algomind and turn your LeetCode grind into lasting knowledge.
          </p>
          <HeroCTA />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="h-4 w-4" />
            <span>Algomind</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built on the science of memory
          </p>
        </div>
      </footer>
    </div>
  )
}
