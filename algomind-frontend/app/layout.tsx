import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { SiteHeader } from '@/components/header'
import { AppSidebar } from '@/components/app-sidebar'
import { Toaster } from 'react-hot-toast'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: 'Algomind',
    description: 'Learn and retain algorithms with ease',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <ClerkProvider>
            <html lang="en" suppressHydrationWarning>
                <body
                    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
                >
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <Toaster />
                        <SidebarProvider>
                            <AppSidebar />
                            <SidebarInset>
                                <SiteHeader />
                                {children}
                            </SidebarInset>
                        </SidebarProvider>
                    </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    )
}
