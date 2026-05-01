'use client'

import HeadingSection from '@/components/shared/heading-section'
import { FeaturePagesHeaderInfo } from '@/constants/sidebar-links'
import { ProblemCapturesView } from '@/features/problem-captures/components/ProblemCapturesView'

export default function InboxPage() {
    return (
        <div className="min-h-screen">
            <div className="relative border-b">
                <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <HeadingSection {...FeaturePagesHeaderInfo.inbox} />
                </div>
            </div>
            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                <ProblemCapturesView />
            </div>
        </div>
    )
}
