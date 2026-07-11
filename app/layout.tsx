import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CodeFit — Daily Code Workouts',
  description: 'CrossFit-style coding workouts. One Core. Four MetCon. Every day.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
