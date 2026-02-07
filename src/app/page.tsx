'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
    const router = useRouter()

  useEffect(() => {
        window.location.href = 'https://bibimake-calendar.vercel.app/'
  }, [])

  return (
        <div className="min-h-screen flex items-center justify-center">
              <div className="text-xl">リダイレクト中...</div>div>
        </div>div>
      )
}</div>
