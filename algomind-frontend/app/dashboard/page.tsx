'use client'
import { PageFlexContainer } from '@/components/shared/containers'
import { TypographyH1 } from '@/components/shared/typography'
import { QueueCard } from '@/components/dashboard/QueueCard'
import StreakCard from '@/components/dashboard/StreakCard'
import { ChartLineLinear } from '@/components/dashboard/LineChart'
import { ChartRadarDefault } from '@/components/dashboard/RadarChart'
export default function DashboardPage() {
    return (
        <PageFlexContainer>
            <TypographyH1>Dashboard</TypographyH1>
            <div className="w-full flex flex-row flex-wrap gap-12">
                <QueueCard />
                <StreakCard />
                <ChartRadarDefault />
                <ChartLineLinear />
            </div>
        </PageFlexContainer>
    )
}
