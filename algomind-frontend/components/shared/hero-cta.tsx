'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function HeroCTA() {
    const { isSignedIn } = useAuth()
    const router = useRouter()

    return (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
                size="lg"
                className="gap-2 px-8"
                onClick={() => router.push(isSignedIn ? '/dashboard' : '/sign-up')}
            >
                {isSignedIn ? 'Go to dashboard' : 'Start for free'}
                <ArrowRight className="h-4 w-4" />
            </Button>
            {!isSignedIn && (
                <Button
                    size="lg"
                    variant="outline"
                    className="px-8"
                    onClick={() => router.push('/sign-in')}
                >
                    Sign in
                </Button>
            )}
        </div>
    )
}
