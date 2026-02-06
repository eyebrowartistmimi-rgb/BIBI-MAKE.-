'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Message = {
  id: string
  content: string
  sender_type: string
  created_at: string
}

export default function StaffChatPage() {
  const params = useParams()
  const router = useRouter()
  const staffName = decodeURIComponent(params.name as string)
  const chatId = params.id as string

  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [chatInfo, setChatInfo] = useState<{ visitor_id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchChatInfo()
    fetchMessages()

    const channel = supabase
      .channel(`staff-chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchChatInfo() {
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('visitor_id')
      .eq('id', chatId)
      .single()

    if (room) setChatInfo(room)
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_room_id', chatId)
      .order('created_at', { ascending: true })

    if (data) setMessages(data)
    setLoading(false)
  }

  async function sendMessage() {
    if (!newMessage.trim() || sending) return
    setSending(true)

    await supabase
      .from('messages')
      .insert({
        chat_room_id: chatId,
        content: newMessage,
        sender_type: 'assistant'
      })

    setNewMessage('')
    setSending(false)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#e8e8e8' }}>
      <div style={{
        background: 'linear-gradient(135deg, #FF69B4, #FF1493)',
        color: 'white',
        padding: '15px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}>
        <span
          onClick={() => router.push(`/staff/${encodeURIComponent(staffName)}`)}
          style={{ cursor: 'pointer', fontSize: '20px' }}
        >
          ←
        </span>
        <div>
          <p style={{ fontWeight: 'bold' }}>👤 {chatInfo?.visitor_id}</p>
          <p style={{ fontSize: '12px', opacity: 0.9 }}>担当: {staffName}</p>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '15px' }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.sender_type === 'assistant' ? 'flex-end' : 'flex-start',
              marginBottom: '10px'
            }}
          >
            <div style={{
              maxWidth: '70%',
              padding: '10px 15px',
              borderRadius: '18px',
              backgroundColor: msg.sender_type === 'assistant' ? '#FF69B4' : 'white',
              color: msg.sender_type === 'assistant' ? 'white' : 'black',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              <p style={{ fontSize: '15px', lineHeight: '1.4' }}>{msg.content}</p>
              <p style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>
                {new Date(msg.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        padding: '10px 15px',
        backgroundColor: 'white',
        display: 'flex',
        gap: '10px',
        borderTop: '1px solid #ddd'
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="メッセージを入力..."
          style={{
            flex: 1,
            padding: '10px 15px',
            borderRadius: '25px',
            border: '1px solid #ddd',
            fontSize: '15px',
            outline: 'none'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          style={{
            padding: '10px 20px',
            borderRadius: '25px',
            border: 'none',
            backgroundColor: sending || !newMessage.trim() ? '#ccc' : '#FF69B4',
            color: 'white',
            fontWeight: 'bold',
            cursor: sending || !newMessage.trim() ? 'default' : 'pointer',
            fontSize: '15px'
          }}
        >
          送信
        </button>
      </div>
    </div>
  )
}
