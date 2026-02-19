'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'
import { Brain, Loader2 } from 'lucide-react'

export default function SSOCallback() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background text-foreground">
            <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Brain className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold tracking-tight">Algomind</span>
            </div>
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Signing you in…</p>
            </div>
            <AuthenticateWithRedirectCallback />
        </div>
    )
}
