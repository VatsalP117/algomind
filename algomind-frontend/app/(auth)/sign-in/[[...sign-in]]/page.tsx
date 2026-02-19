'use client'

import { useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Brain, Loader2 } from 'lucide-react'

export default function SignInPage() {
    const { isLoaded, signIn, setActive } = useSignIn()
    const router = useRouter()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded) return
        setLoading(true)
        setError('')

        try {
            const result = await signIn.create({
                identifier: email,
                password,
            })

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId })
                router.push('/dashboard')
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.longMessage ?? 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogle = () => {
        if (!isLoaded) return
        signIn.authenticateWithRedirect({
            strategy: 'oauth_google',
            redirectUrl: '/sso-callback',
            redirectUrlComplete: '/dashboard',
        })
    }

    return (
        <div className="flex min-h-screen">
            {/* Left branding panel */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/10">
                        <Brain className="h-4 w-4" />
                    </div>
                    <span className="text-lg font-bold">Algomind</span>
                </div>
                <div>
                    <blockquote className="text-2xl font-medium leading-relaxed">
                        "The spacing effect is one of the most robust findings in cognitive psychology."
                    </blockquote>
                    <p className="mt-4 text-primary-foreground/70">— Hermann Ebbinghaus, 1885</p>
                </div>
                <div className="space-y-3 text-sm text-primary-foreground/70">
                    <p>✓ SM-2 spaced repetition algorithm</p>
                    <p>✓ LeetCode auto-import</p>
                    <p>✓ Under 5 minutes of review per day</p>
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="mb-8 flex items-center gap-2 lg:hidden">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Brain className="h-4 w-4" />
                        </div>
                        <span className="text-lg font-bold">Algomind</span>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Sign in to your account to continue
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        {error && (
                            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {error}
                            </p>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign in
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">or</span>
                        </div>
                    </div>

                    <div id="clerk-captcha" />
                    <Button variant="outline" className="w-full gap-2" onClick={handleGoogle} type="button">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </Button>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link href="/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
