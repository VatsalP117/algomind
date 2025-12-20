import { SiteHeader } from '@/components/shared/header'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { SidebarInset } from '@/components/ui/sidebar'
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <AppSidebar />
            <SidebarInset>
                <SiteHeader />
                {children}
            </SidebarInset>
        </>
    )
}
