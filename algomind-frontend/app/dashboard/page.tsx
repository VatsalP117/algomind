'use client'
import {
    PageFlexContainer,
    SectionContainer,
    SectionFlexContainer,
} from '@/components/containers'
import { TypographyH1 } from '@/components/typography'
import { QueueCard } from '@/components/dashboard/QueueCard'
import StreakCard from '@/components/dashboard/StreakCard'
import { ChartLineLinear } from '@/components/dashboard/LineChart'
import { ChartRadarDefault } from '@/components/dashboard/RadarChart'
import { SignIn, useAuth, useUser } from '@clerk/nextjs'
export default function DashboardPage() {
    const { isSignedIn } = useUser()
    if (!isSignedIn) {
        return <SignIn />
    }

    return (
        <PageFlexContainer className="justify-start items-start">
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
