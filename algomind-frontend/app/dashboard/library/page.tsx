'use client'

import HeadingSection from '@/components/shared/heading-section'
import { FeaturePagesHeaderInfo } from '@/constants/sidebar-links'
import { LibraryView } from '@/features/library/components/LibraryView'

export default function LibraryPage() {
    return (
        <div className="min-h-screen">
            <div className="relative border-b">
                <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <HeadingSection
                        {...FeaturePagesHeaderInfo.library}
                    />
                </div>
            </div>
            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                <LibraryView />
            </div>
        </div>
    )
}
