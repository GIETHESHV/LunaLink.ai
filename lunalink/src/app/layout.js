import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import AuthGuard from "@/components/auth-guard"
import "./globals.css"

export const metadata = {
  title: "LunaLink - AI Chatbot",
  description: "Your intelligent AI companion for seamless conversations",
  generator: "v0.app",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <AuthGuard>
          <Suspense fallback={null}>{children}</Suspense>
        </AuthGuard>
        <Analytics />
      </body>
    </html>
  )
}
