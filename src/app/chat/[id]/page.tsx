'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Assistant = {
  id: string
  name: string
  notes: string | null
}

export default function ChatRoom() {
  const params = useParams()
  const assistantId = params.id as string
  const [assistant, setAssistant] = useState<Assistant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAssistant() {
      const { data } = await supabase
        .from('assistants')
        .select('*')
        .eq('id', assistantId)
        .single()
      if (data) setAssistant(data)
      setLoading(false)
    }
    fetchAssistant()
  }, [assistantId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    )
  }

  const assistantName = assistant?.name || 'アシスタント'
  const lineMessage = encodeURIComponent(assistantName + 'さん希望です')
  const lineUrl = 'https://line.me/R/oaMessage/@053vjqgl/?' + lineMessage

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col">
      <div className="bg-pink-500 text-white p-4 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center">
          <Link href="/" className="mr-4">
            <span className="text-2xl">←</span>
          </Link>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-pink-300 rounded-full flex items-center justify-center mr-3">
              <span className="text-xl">👩</span>
            </div>
            <div>
              <div className="font-bold">{assistantName}</div>
              <div className="text-xs text-pink-100">
                {assistant?.notes || '立ち合いサポート'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {assistantName}にLINEで相談
            </h2>
            <p className="text-gray-600 mb-6">
              下のボタンからLINEでメッセージを送れます。
              返信もLINEに届くので安心です✨
            </p>

            <a 
              href={lineUrl}
              className="block w-full bg-[#06C755] text-white font-bold py-4 px-6 rounded-full text-lg hover:bg-[#05b34c] transition-colors shadow-lg"
            >
              📱 LINEで相談する
            </a>

            <p className="text-xs text-gray-400 mt-4">
              LINE公式アカウントが開きます。友だち追加がまだの方は追加してからメッセージを送ってください。
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
