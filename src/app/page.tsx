'use client'

import { useEffect } from 'react'

export default function Home() {
      useEffect(() => {
              window.location.href = 'https://bibimake-calendar.vercel.app/'
      }, [])

  return null
}
