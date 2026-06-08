import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AnimationProvider } from '@/context/AnimationContext'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'nohjuntae_',
  description: 'NohJunTae · AI-assisted works archive',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} bg-white text-zinc-900`}>
      <body className="min-h-screen flex flex-col antialiased">
        <AnimationProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AnimationProvider>
      </body>
    </html>
  )
}
