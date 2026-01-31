'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Assistant = {
  id: string
  name: string
  notes: string | null
  profile_image_url: string | null
  google_calendar_url: string | null
}

export default function AssistantPage() {
  const searchParams = useSearchParams()
  const locationId = searchParams.get('location')
  
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [locationName, setLocationName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!locationId) return

      // 施術場所名を取得
      const { data: locationData } = await supabase
        .from('locations')
        .select('name')
        .eq('id', locationId)
        .single()
      
      if (locationData) {
        setLocationName(locationData.name)
      }

      // 全アシスタントを取得（後で対応表と連携可能）
      const { data: assistantData, error } = await supabase
        .from('assistants')
        .select('*')
        .order('name')
      
      if (error) {
        console.error('Error fetching assistants:', error)
      } else {
        setAssistants(assistantData || [])
      }
      setLoading(false)
    }

    fetchData()
  }, [locationId])

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
        <div className="text-center mb-6">
          <Link href="/" className="text-pink-500 hover:text-pink-600">
            ← 施術場所選択に戻る
          </Link>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            BIBIMAKE
          </h1>
          <p className="text-lg text-gray-600">
            {locationName}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            ② サポートアシスタントを選択
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            {assistants.map((assistant) => (
              <Link
                key={assistant.id}
                href={`/chat/${assistant.id}?location=${locationId}`}
                className="block p-4 bg-pink-50 hover:bg-pink-100 rounded-xl border-2 border-pink-200 hover:border-pink-400 transition-all text-center"
              >
                <div className="w-16 h-16 bg-pink-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl">👩</span>
                </div>
                <div className="font-medium text-gray-800">
                  {assistant.name}
                </div>
                {assistant.notes && (
                  <div className="text-xs text-gray-500 mt-1">
                    {assistant.notes}
                  </div>
                )}
                {assistant.google_calendar_url && (
                  <div className="mt-2">
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                      予約可能
                    </span>
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
