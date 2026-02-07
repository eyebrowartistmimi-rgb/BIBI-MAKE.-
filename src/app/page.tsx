'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Location = {
  id: string
  name: string
  address: string | null
}

export default function Home() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLocations() {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name')
      
      if (error) {
        console.error('Error fetching locations:', error)
      } else {
        setLocations(data || [])
      }
      setLoading(false)
    }

    fetchLocations()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            BIBIMAKE
          </h1>
          <p className="text-lg text-gray-600">
            立ち合いサポート予約
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            ① 施術場所を選択してください
          </h2>
          
          <div className="space-y-3">
            {locations.map((location) => (
              <Link
                key={location.id}
                href={`/assistant?location=${location.id}`}
                className="block w-full p-4 bg-pink-50 hover:bg-pink-100 rounded-xl border-2 border-pink-200 hover:border-pink-400 transition-all"
              >
                <div className="font-medium text-gray-800">
                  {location.name}
                </div>
                {location.address && (
                  <div className="text-sm text-gray-500 mt-1">
                    {location.address}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          © BIBIMAKE All Rights Reserved
        </div>
      </div>
    </main>
  )
}
