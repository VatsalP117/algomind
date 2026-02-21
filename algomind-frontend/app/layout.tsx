import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Providers from "@/components/providers";
import { AnalyticsComponent } from '@/components/AnalyticsComponent'

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
            <Providers>
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
                            {children}
                            <AnalyticsComponent />
                        </ThemeProvider>
                    </body>
                </html>
            </Providers>
        </ClerkProvider>
    )
}
