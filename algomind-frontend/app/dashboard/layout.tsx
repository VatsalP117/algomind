import { SiteHeader } from '@/components/shared/header'
import { AppSidebar } from '@/components/shared/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <SiteHeader />
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}
