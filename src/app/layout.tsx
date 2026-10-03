import type { Metadata } from 'next'
import './globals.css'
import { ThemeWrapper } from '@/components/theme-wrapper'

export const metadata: Metadata = {
  title: 'NexaOS – Business Operating System',
  description: 'All-in-one business management platform for freelancers, agencies, and small businesses.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  )
}
