"use client"
import { useEffect } from 'react';
import { Iris } from '@bigchill101/iris';
import { usePathname } from 'next/navigation';

export function AnalyticsComponent() {
    const pathname = usePathname();

    useEffect(() => {
        // Only initialize once on mount
        const analytics = new Iris({
            host: "https://analytics.algomind.pro",
            siteId: "algomind"
        });

        // Automatically tracks pageviews / web-vitals
        analytics.start();

        // In React 18 / Next.js Strict Mode, make sure to clean up 
        // to prevent duplicate events during dev hot-reloads
        return () => analytics.stop();
    }, [pathname]);

    return null;
}
