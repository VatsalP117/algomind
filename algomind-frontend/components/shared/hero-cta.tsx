'use client'

import { useAuth } from '@clerk/nextjs'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export function HeroCTA() {
    const { isSignedIn } = useAuth()

    return (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href={isSignedIn ? '/dashboard' : '/sign-up'}>
                <Button size="lg" className="gap-2 px-8">
                    {isSignedIn ? 'Go to dashboard' : 'Start for free'}
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </Link>
            {!isSignedIn && (
                <Link href="/sign-in">
                    <Button size="lg" variant="outline" className="px-8">
                        Sign in
                    </Button>
                </Link>
            )}
        </div>
    )
}
