'use client'

import HeadingSection from '@/components/shared/heading-section'
import { FeaturePagesHeaderInfo } from '@/constants/sidebar-links'
import { PatternInsightsView } from '@/features/pattern-intelligence'

export default function PatternsPage() {
    return (
        <div className="min-h-screen">
            <div className="relative border-b">
                <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <HeadingSection {...FeaturePagesHeaderInfo.patterns} />
                </div>
            </div>
            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                <PatternInsightsView />
            </div>
        </div>
    )
}
