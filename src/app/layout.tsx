import type { Metadata } from "next"
import "@fontsource/manrope/400.css"
import "@fontsource/manrope/500.css"
import "@fontsource/manrope/600.css"
import "@fontsource/manrope/700.css"
import "@fontsource/space-grotesk/500.css"
import "@fontsource/space-grotesk/700.css"
import "@fontsource/ibm-plex-mono/400.css"
import "@fontsource/ibm-plex-mono/500.css"

import { ThemeProvider } from "@/components/site/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI 资讯",
  description:
    "一个干净、专业、摘要优先的 AI 资讯聚合体验，聚焦文章与动态。",
}

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode
  modal: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          {modal}
        </ThemeProvider>
      </body>
    </html>
  )
}
