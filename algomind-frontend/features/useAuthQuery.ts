import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { useAuth } from '@clerk/nextjs'
export function useAuthQuery<T>(options: UseQueryOptions<T>) {
    const { isLoaded, isSignedIn } = useAuth()

    return useQuery({
        ...options,
        enabled: isLoaded && isSignedIn && options.enabled !== false,
    })
}
