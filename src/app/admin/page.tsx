'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type ChatRoom = {
  id: string
  name: string
  created_at: string
  assistant_id: string
  assistants: {
    name: string
  }
}

type Message = {
  id: string
  content: string
  created_at: string
}

export default function AdminDashboard() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [latestMessages, setLatestMessages] = useState<{[key: string]: Message}>({})

  useEffect(() => {
    fetchChatRooms()
  }, [])

  async function fetchChatRooms() {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        assistants (name)
      `)
      .order('created_at', { ascending: false })

    if (data) {
      setChatRooms(data)
      
      // 各チャットルームの最新メッセージを取得
      for (const room of data) {
        const { data: msgData } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (msgData) {
          setLatestMessages(prev => ({...prev, [room.id]: msgData}))
        }
      }
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="bg-pink-500 text-white p-4 shadow-md">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold">📋 管理者ダッシュボード</h1>
          <p className="text-pink-100 text-sm">全てのチャットを確認できます</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <div className="space-y-3">
          {chatRooms.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center text-gray-500">
              まだチャットがありません
            </div>
          ) : (
            chatRooms.map((room) => (
              <Link 
                key={room.id} 
                href={`/admin/chat/${room.id}`}
                className="block bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-gray-800">
                      👤 {room.name}
                    </div>
                    <div className="text-sm text-pink-500">
                      担当: {room.assistants?.name}
                    </div>
                    {latestMessages[room.id] && (
                      <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                        {latestMessages[room.id].content}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(room.created_at).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
