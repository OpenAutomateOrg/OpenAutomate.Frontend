import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/providers/theme-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { config } from '@/lib/config'
import { Toaster } from '@/components/ui/toaster'
import { ToastProvider } from '@/components/ui/toast-provider'
import { LocaleProvider } from '@/providers/locale-provider'
import { SWRProvider } from '@/providers/swr-provider'


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: config.app.name,
  description: 'Automate your business processes with OpenAutomate',
  authors: [
    {
      name: 'OpenAutomate Team',
    },
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <LocaleProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <ToastProvider>
              <SWRProvider>
                <AuthProvider>
                  <div className="min-h-screen flex flex-col antialiased bg-background">
                    {children}
                  </div>
                  <Toaster />
                </AuthProvider>
              </SWRProvider>
            </ToastProvider>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
