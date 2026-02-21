'use client'; // <--- Critical: This allows Context to work

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
    // We use useState so the Client is created once per session,
    // preventing data loss on re-renders.
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,       // 1 min — data treated as fresh
                gcTime: 5 * 60 * 1000,      // 5 min — keep cache after unmount
                retry: 1,                   // fail fast — don't retry 3 times
                refetchOnWindowFocus: false, // don't surprise-refetch on tab switch
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}