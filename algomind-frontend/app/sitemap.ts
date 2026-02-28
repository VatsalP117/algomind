import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date()

    return [
        {
            url: siteConfig.url,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${siteConfig.url}/resources`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${siteConfig.url}/resources/spaced-repetition-coding-interviews`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${siteConfig.url}/resources/leetcode-spaced-repetition-guide`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
    ]
}
