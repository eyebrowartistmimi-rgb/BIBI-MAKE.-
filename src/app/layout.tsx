import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BIBIMAKE 立ち合い予約',
  description: 'BIBIMAKE 立ち合いサポート予約システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
