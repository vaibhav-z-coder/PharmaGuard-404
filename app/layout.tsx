import type { Metadata, Viewport } from "next"
import { DM_Sans, JetBrains_Mono } from "next/font/google"
import { Toaster } from "sonner"
import DnaBackground from "@/components/dna-background"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "PharmaGuard -- Pharmacogenomic Analysis Tool",
  description:
    "CPIC-aligned pharmacogenomic risk assessment. Upload VCF files to analyze drug-gene interactions, receive clinical recommendations, and AI-powered explanations.",
}

export const viewport: Viewport = {
  themeColor: "#0f766e",
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        <DnaBackground />
        <div className="relative" style={{ zIndex: 1 }}>
          {children}
          <Toaster
            richColors
            position="top-right"
            toastOptions={{ style: { fontFamily: "var(--font-sans)" } }}
          />
        </div>
      </body>
    </html>
  )
}
