import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/providers/theme-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { config } from '@/lib/config'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { Toaster } from '@/components/ui/toaster'
import { ToastProvider } from '@/components/ui/toast-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: config.app.name,
  description: 'Automate your business processes with OpenAutomate',
  authors: [
    {
      name: 'OpenAutomate Team',
    },
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const { locale } = params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  const messages = (await import(`@/messages/${locale}.json`)).default

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <ToastProvider>
              <AuthProvider>
                <div className="min-h-screen flex flex-col antialiased bg-background">
                  {children}
                </div>
                <Toaster />
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
