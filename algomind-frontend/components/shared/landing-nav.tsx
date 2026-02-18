'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Brain, Moon, Sun } from 'lucide-react'

export function LandingNav() {
    const { theme, setTheme } = useTheme()

    return (
        <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Brain className="h-4 w-4" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">Algomind</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        aria-label="Toggle theme"
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </Button>
                    <Link href="/sign-in">
                        <Button variant="ghost" size="sm">Sign in</Button>
                    </Link>
                    <Link href="/sign-up">
                        <Button size="sm">Get started</Button>
                    </Link>
                </div>
            </div>
        </nav>
    )
}
