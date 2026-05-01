'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import {
    useCreatePairingCode,
    useExtensionInstallations,
    useRevokeExtensionInstallation,
} from '../api/useExtensionManagement'

export function ExtensionManagementView() {
    const { data: installations = [], isLoading } = useExtensionInstallations()
    const createPairingCode = useCreatePairingCode()
    const revokeInstallation = useRevokeExtensionInstallation()
    const [now, setNow] = useState(() => Date.now())
    const [pairingCode, setPairingCode] = useState<{
        code: string
        expiresAt: string
    } | null>(null)

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000)
        return () => window.clearInterval(timer)
    }, [])

    const activeInstallations = useMemo(
        () => installations.filter((installation) => !installation.revoked_at),
        [installations],
    )
    const secondsRemaining = pairingCode
        ? Math.max(
              0,
              Math.floor(
                  (new Date(pairingCode.expiresAt).getTime() - now) / 1000,
              ),
          )
        : null

    const handleGenerateCode = async () => {
        const result = await createPairingCode.mutateAsync()
        setPairingCode({
            code: result.code,
            expiresAt: result.expires_at,
        })
    }

    const handleCopy = async () => {
        if (!pairingCode) return
        await navigator.clipboard.writeText(pairingCode.code)
        toast.success('Pairing code copied')
    }

    const formatCountdown = (value: number | null) => {
        if (value === null) return null
        const minutes = Math.floor(value / 60)
        const seconds = value % 60
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
                <CardHeader>
                    <CardTitle>Pair a browser</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ol className="space-y-2 text-sm text-muted-foreground">
                        <li>1. Install the Algomind Chrome extension.</li>
                        <li>2. Click Generate pairing code below.</li>
                        <li>3. Paste the code into the extension popup.</li>
                    </ol>

                    <div className="flex flex-wrap gap-3">
                        <Button
                            onClick={handleGenerateCode}
                            disabled={createPairingCode.isPending}
                        >
                            {createPairingCode.isPending
                                ? 'Generating...'
                                : 'Generate pairing code'}
                        </Button>
                        {pairingCode && (
                            <Button variant="outline" onClick={handleCopy}>
                                Copy code
                            </Button>
                        )}
                    </div>

                    {pairingCode && (
                        <div className="rounded-lg border bg-muted/30 p-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <code className="text-2xl font-semibold tracking-[0.3em]">
                                    {pairingCode.code}
                                </code>
                                <Badge variant="secondary">
                                    Expires in {formatCountdown(secondsRemaining)}
                                </Badge>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                This code is single-use and automatically
                                expires.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Connected browsers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2].map((item) => (
                                <div
                                    key={item}
                                    className="h-20 animate-pulse rounded-lg bg-muted"
                                />
                            ))}
                        </div>
                    ) : activeInstallations.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No extension installations connected yet.
                        </p>
                    ) : (
                        activeInstallations.map((installation) => (
                            <div
                                key={installation.id}
                                className="rounded-lg border p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">
                                                {installation.name}
                                            </p>
                                            <Badge variant="outline">
                                                {installation.browser}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Paired{' '}
                                            {installation.created_at.split('T')[0]}
                                            {installation.last_seen_at
                                                ? ` · Last seen ${installation.last_seen_at.split('T')[0]}`
                                                : ''}
                                        </p>
                                        {installation.extension_version && (
                                            <p className="text-xs text-muted-foreground">
                                                Version{' '}
                                                {installation.extension_version}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            revokeInstallation.mutate(
                                                installation.id,
                                            )
                                        }
                                        disabled={revokeInstallation.isPending}
                                    >
                                        Disconnect
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
