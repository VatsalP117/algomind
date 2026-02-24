"use client"
import { useEffect } from 'react';
import { Iris } from '@bigchill101/iris';

export function AnalyticsComponent() {
    useEffect(() => {
        const analytics = new Iris({
            host: "https://analytics.algomind.pro",
            siteId: "algomind",
            autocapture: {
                pageviews: true,
                webvitals: true,
            }
        });

        analytics.start();

        // In React 18 / Next.js Strict Mode, make sure to clean up 
        // to prevent duplicate events during dev hot-reloads
        return () => analytics.stop();
    }, []);

    return null;
}
