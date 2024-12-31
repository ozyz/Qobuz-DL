import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import ParticlesComponent from "@/components/particles";
import { StatusBarProvider } from "@/lib/status-bar/context";
import StatusBarContainer from "@/components/status-bar/container";
import { FFmpegProvider } from "@/lib/ffmpeg-provider";
import SettingsForm from "@/components/ui/settings-form";
import { SettingsProvider } from "@/lib/settings-provider";
import { BackgroundProvider } from "@/lib/background-provider";
import { Button } from "@/components/ui/button";
import { InfoIcon, Link } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FaGithub } from "@react-icons/all-files/fa/FaGithub";
import { FaDiscord } from "@react-icons/all-files/fa/FaDiscord";
import { FaSteam } from "@react-icons/all-files/fa/FaSteam";
import { FaSpotify } from "@react-icons/all-files/fa/FaSpotify";

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
})

export const metadata: Metadata = {
    title: {
        default: process.env.NEXT_PUBLIC_APPLICATION_NAME + " - A frontend browser client for downloading music for Qobuz.",
        template: process.env.NEXT_PUBLIC_APPLICATION_NAME!
    },
    description: "A frontend browser client for downloading music for Qobuz."
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} antialiased`}>
                <FFmpegProvider>
                    <StatusBarProvider>
                        <SettingsProvider>
                            <BackgroundProvider>
                                <ThemeProvider
                                    attribute="class"
                                    defaultTheme="dark"
                                    enableSystem
                                >
                                    <ParticlesComponent className="z-[-1] h-full w-full fixed" />
                                    <div className="fixed justify-between items-center flex w-full max-w-screen p-4 z-[10]">
                                        <SettingsForm />
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="icon">
                                                    <InfoIcon />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle className="text-xl">{process.env.NEXT_PUBLIC_APPLICATION_NAME}</DialogTitle>
                                                    <DialogDescription>
                                                        A frontend browser client for downloading music for Qobuz.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <Separator />
                                                <div className="flex flex-col gap-1">
                                                    <DialogTitle>Links</DialogTitle>
                                                    <DialogDescription>Check out our GitHub and Discord!</DialogDescription>
                                                </div>
                                                <div className="flex justify-center items-center gap-2">
                                                    <a href={process.env.NEXT_PUBLIC_GITHUB} rel="noopener noreferrer" target="_blank">                                                    
                                                        <Button variant="outline" size="icon">
                                                            <FaGithub />
                                                        </Button>
                                                    </a>
                                                    <a href="https://discord.com/invite/mWQ6bCfkfA" rel="noopener noreferrer" target="_blank">
                                                        <Button variant="outline" size="icon">
                                                            <FaDiscord />
                                                        </Button>
                                                    </a>
                                                    <p>/</p>
                                                    <a href={process.env.NEXT_PUBLIC_DISCORD} rel="noopener noreferrer" target="_blank">                                                    
                                                        <Button variant="outline" size="icon">
                                                            <FaDiscord />
                                                        </Button>
                                                    </a>
                                                </div>
                                                <Separator />
                                                <div className="flex flex-col gap-1">
                                                    <DialogTitle>Contributors</DialogTitle>
                                                    <DialogDescription>Special thanks to our contributors!</DialogDescription>
                                                </div>
                                                <div className="flex justify-start items-center gap-2 w-full">
                                                    <img src="https://cdn.discordapp.com/avatars/1093113069149880330/a899d1378cfe1e951fc29e4fc4162f55.webp" alt="Farmz" crossOrigin="anonymous" className="w-20 h-20 rounded-full"/>
                                                    <div className="h-full pl-1">
                                                        <p className="font-bold text-xl">Farmz</p>
                                                        <a href="https://discord.com/users/1093113069149880330" rel="noopener noreferrer" target="_blank">
                                                            <Button variant="outline" size="icon">
                                                                <FaDiscord />
                                                            </Button>
                                                        </a>
                                                        <a href="https://github.com/FarmzDev/" rel="noopener noreferrer" target="_blank">
                                                            <Button variant="outline" size="icon">
                                                                <FaGithub />
                                                            </Button>
                                                        </a>
                                                        <p className="text-sm text-muted-foreground">Main Developer</p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-start items-center gap-2 w-full">
                                                    <img src="https://cdn.discordapp.com/avatars/662243382378233866/f5d56c6a86eb57a2cfb1f11be1c0f9de.webp" alt="Jkable" crossOrigin="anonymous" className="w-20 h-20 rounded-full"/>
                                                    <div className="h-full pl-1">
                                                        <p className="font-bold text-xl">Jkable</p>
                                                        <a href="https://discord.com/users/662243382378233866" rel="noopener noreferrer" target="_blank">
                                                            <Button variant="outline" size="icon">
                                                                <FaDiscord />
                                                            </Button>
                                                        </a>
                                                        <a href="https://github.com/Jkablez/" rel="noopener noreferrer" target="_blank">
                                                            <Button variant="outline" size="icon">
                                                                <FaGithub />
                                                            </Button>
                                                        </a>
                                                        <p className="text-sm text-muted-foreground">Helped with development</p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-start items-center gap-2 w-full">
                                                    <img src="https://cdn.discordapp.com/avatars/742554193700847627/5b2cf3105c90784d94230347e54a421b.webp" alt="Joel15" crossOrigin="anonymous" className="w-20 h-20 rounded-full"/>
                                                    <div className="h-full pl-1">
                                                        <p className="font-bold text-xl">Joel15</p>
                                                        <a href="https://discord.com/users/742554193700847627" rel="noopener noreferrer" target="_blank">
                                                            <Button variant="outline" size="icon">
                                                                <FaDiscord />
                                                            </Button>
                                                        </a>
                                                        <a href="https://steamcommunity.com/profiles/76561198317104390" rel="noopener noreferrer" target="_blank">
                                                            <Button variant="outline" size="icon">
                                                                <FaSteam />
                                                            </Button>
                                                        </a>
                                                        <a href="https://open.spotify.com/user/315reccubycoatin2rv5gjhostxe" rel="noopener noreferrer" target="_blank">
                                                            <Button variant="outline" size="icon">
                                                                <FaSpotify />
                                                            </Button>
                                                        </a>
                                                        <p className="text-sm text-muted-foreground">Helped to purchase <a href="https://qobuz-dl.com" target="_blank" rel="noopener noreferrer" className="underline">https://qobuz-dl.com</a></p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-start items-center gap-2 w-full">
                                                    <img src="https://cdn.discordapp.com/avatars/135210155418714112/4d648a65c805583a27b4aa5a06b7b541.webp" alt="Kobayashi" crossOrigin="anonymous" className="w-20 h-20 rounded-full"/>
                                                    <div className="h-full pl-1">
                                                        <p className="font-bold text-xl">Kobayashi</p>
                                                        <a href="https://discord.com/users/742554193700847627" rel="noopener noreferrer" target="_blank">
                                                            <Button variant="outline" size="icon">
                                                                <FaDiscord />
                                                            </Button>
                                                        </a>
                                                        <a href="https://ryuko.space/" rel="noopener noreferrer" target="_blank">
                                                            <Button variant="outline" size="icon">
                                                                <Link />
                                                            </Button>
                                                        </a>
                                                        <p className="text-sm text-muted-foreground">Runs an instance of Qobuz-DL at <a href="https://squid.wtf" target="_blank" rel="noopener noreferrer" className="underline">https://squid.wtf</a></p>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <div className="flex flex-col min-h-screen">
                                        <main className="px-6 pb-12 pt-32 md:pt-60 min-h-full flex-1 flex flex-col items-center justify-center gap-2 z-[2] overflow-x-hidden max-w-screen overflow-y-hidden">
                                            {children}
                                        </main>
                                        <StatusBarContainer />
                                    </div>
                                </ThemeProvider>
                            </BackgroundProvider>
                        </SettingsProvider>
                    </StatusBarProvider>
                    <script src="https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.9.7/dist/ffmpeg.min.js"></script>
                </FFmpegProvider>
            </body>
        </html>
    );
}
