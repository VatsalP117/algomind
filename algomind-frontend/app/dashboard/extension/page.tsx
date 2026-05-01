'use client'

import HeadingSection from '@/components/shared/heading-section'
import { FeaturePagesHeaderInfo } from '@/constants/sidebar-links'
import { ExtensionManagementView } from '@/features/extension/components/ExtensionManagementView'

export default function ExtensionPage() {
    return (
        <div className="min-h-screen">
            <div className="relative border-b">
                <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <HeadingSection {...FeaturePagesHeaderInfo.extension} />
                </div>
            </div>
            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                <ExtensionManagementView />
            </div>
        </div>
    )
}
