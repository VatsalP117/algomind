import { toast } from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuthQuery } from '@/features/useAuthQuery'
import { api } from '@/lib/api-client'

export type PairingCode = {
    code: string
    expires_at: string
}

export type ExtensionInstallation = {
    id: string
    name: string
    browser: string
    extension_version?: string | null
    created_at: string
    last_seen_at?: string | null
    revoked_at?: string | null
}

export const useExtensionInstallations = () => {
    return useAuthQuery<ExtensionInstallation[]>({
        queryKey: ['extension-installations'],
        queryFn: async () => {
            const response = await api.get<ExtensionInstallation[]>(
                '/extension/installations',
            )
            return response.data ?? []
        },
    })
}

export const useCreatePairingCode = () => {
    return useMutation({
        mutationFn: async () => {
            const response = await api.post<PairingCode>(
                '/extension/pairing-codes',
            )
            return response.data
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.message ||
                    'Failed to generate pairing code',
            )
        },
    })
}

export const useRevokeExtensionInstallation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (installationId: string) => {
            await api.delete(`/extension/installations/${installationId}`)
            return installationId
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['extension-installations'],
            })
            toast.success('Extension disconnected')
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.message ||
                    'Failed to disconnect extension',
            )
        },
    })
}
