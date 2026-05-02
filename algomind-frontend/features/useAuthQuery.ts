import { useAuth } from '@clerk/nextjs'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
export function useAuthQuery<T>(options: UseQueryOptions<T>) {
    const { isLoaded, isSignedIn } = useAuth()

    return useQuery({
        ...options,
        enabled: isLoaded && isSignedIn && options.enabled !== false,
    })
}
