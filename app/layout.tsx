import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { StatusBarProvider } from "@/lib/status-bar/context";
import StatusBarContainer from "@/components/status-bar/container";
import { Toaster } from "@/components/ui/toaster"
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FaDiscord } from "@react-icons/all-files/fa/FaDiscord";
import { FaGithub } from "@react-icons/all-files/fa/FaGithub";

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
})

export const metadata: Metadata = {
    metadataBase: new URL('https://www.qobuz-dl.com/'), // Site URL
    title: {
        default: process.env.NEXT_PUBLIC_APPLICATION_NAME + " - A frontend browser client for downloading music for Qobuz.",
        template: process.env.NEXT_PUBLIC_APPLICATION_NAME!
    },
    description: "A frontend browser client for downloading music for Qobuz.",
    openGraph: {
        images: process.env.NEXT_PUBLIC_APPLICATION_NAME!.toLowerCase() === "qobuz-dl"
            ? [{ url: '/logo/qobuz-banner.png', width: 650, height: 195, alt: 'Qobuz Logo' }]
            : [],
    },
    keywords: [
        `${process.env.NEXT_PUBLIC_APPLICATION_NAME!}`,
        "music",
        "downloader",
        "hi-res",
        "qobuz",
        "flac",
    ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body className={`${inter.className} antialiased`} suppressHydrationWarning>
                <StatusBarProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="dark"
                    >
                        <div className="fixed justify-between items-center flex w-full max-w-screen p-4 z-[10]">
                            {/* Placeholder for future top-left items if needed */}
                            <div></div>
                            <div className="flex gap-2 items-center">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <FaDiscord />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem>
                                            <a href="https://discord.com/invite/mWQ6bCfkfA" target="_blank" rel="noopener noreferrer">Qobuz-DL Discord</a>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <a href="https://discord.gg/invite/GN7GnntyQ2" target="_blank" rel="noopener noreferrer">Squidboard Discord</a>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <a href="https://github.com/QobuzDL/Qobuz-DL" target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="icon">
                                        <FaGithub />
                                    </Button>
                                </a>
                            </div>
                        </div>
                        <div className="flex flex-col min-h-screen">
                            <main className="px-6 pb-12 pt-32 md:pt-24 2xl:pt-60 min-h-full flex-1 flex flex-col items-center justify-center gap-2 z-[2] overflow-x-hidden max-w-screen overflow-y-hidden">
                                {children}
                            </main>
                            <Toaster />
                            <StatusBarContainer />
                        </div>
                    </ThemeProvider>
                </StatusBarProvider>
            </body>
        </html>
    );
}