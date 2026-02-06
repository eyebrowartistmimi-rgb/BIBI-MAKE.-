'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ChatRoom = {
  id: string
  visitor_id: string
  created_at: string
  assistant_id: string
  assistants: { name: string }
  latest_message?: string
}

export default function StaffPage() {
  const params = useParams()
  const router = useRouter()
  const staffName = decodeURIComponent(params.name as string)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChatRooms()
  }, [staffName])

  async function fetchChatRooms() {
    setLoading(true)

    const { data: assistant } = await supabase
      .from('assistants')
      .select('id, name')
      .eq('name', staffName)
      .single()

    if (!assistant) {
      setLoading(false)
      return
    }

    const { data: rooms } = await supabase
      .from('chat_rooms')
      .select('id, visitor_id, created_at, assistant_id, assistants(name)')
      .eq('assistant_id', assistant.id)
      .order('created_at', { ascending: false })

    if (rooms) {
      const roomsWithMessages = await Promise.all(
        rooms.map(async (room: any) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('content')
            .eq('chat_room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)

          return {
            ...room,
            latest_message: messages?.[0]?.content || ''
          }
        })
      )
      setChatRooms(roomsWithMessages)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, #FF69B4, #FF1493)',
        color: 'white',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>💬 {staffName} のチャット</h1>
        <p style={{ fontSize: '14px', opacity: 0.9 }}>あなた宛のメッセージ一覧</p>
      </div>

      <div style={{ padding: '10px', maxWidth: '600px', margin: '0 auto' }}>
        {chatRooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
            <p style={{ fontSize: '16px' }}>まだメッセージはありません</p>
          </div>
        ) : (
          chatRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => router.push(`/staff/${encodeURIComponent(staffName)}/chat/${room.id}`)}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '15px',
                marginBottom: '10px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 'bold', fontSize: '16px' }}>👤 {room.visitor_id}</p>
                  {room.latest_message && (
                    <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                      {room.latest_message.substring(0, 50)}
                      {room.latest_message.length > 50 ? '...' : ''}
                    </p>
                  )}
                </div>
                <span style={{ color: '#999', fontSize: '12px' }}>
                  {new Date(room.created_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
