'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Message = {
  id: string
  content: string
  sender_type: 'assistant' | 'student'
  created_at: string
}

type ChatRoom = {
  id: string
  name: string
  assistant_id: string
  assistants: {
    name: string
  }
}

export default function AdminChatRoom() {
  const params = useParams()
  const chatRoomId = params.id as string
  
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
  }, [chatRoomId])

  useEffect(() => {
    if (!chatRoomId) return

    const channel = supabase
      .channel('admin-messages-' + chatRoomId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${chatRoomId}`
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatRoomId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchData() {
    const { data: roomData } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        assistants (name)
      `)
      .eq('id', chatRoomId)
      .single()

    if (roomData) {
      setChatRoom(roomData)
    }

    const { data: messagesData } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_room_id', chatRoomId)
      .order('created_at', { ascending: true })

    if (messagesData) {
      setMessages(messagesData)
    }

    setLoading(false)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatRoomId) return

    const messageText = newMessage
    setNewMessage('')

    const { error } = await supabase
      .from('messages')
      .insert({
        chat_room_id: chatRoomId,
        content: messageText,
        sender_type: 'assistant'
      })

    if (error) {
      console.error('error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-pink-500 text-white p-4 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center">
          <Link href="/admin" className="mr-4">
            <span className="text-2xl">←</span>
          </Link>
          <div>
            <div className="font-bold">👤 {chatRoom?.name}</div>
            <div className="text-xs text-pink-100">
              担当: {chatRoom?.assistants?.name}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_type === 'assistant' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-2xl p-4 max-w-xs shadow ${
                  message.sender_type === 'assistant'
                    ? 'bg-pink-500 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 rounded-tl-none'
                }`}
              >
                <p>{message.content}</p>
                <div className={`text-xs mt-2 ${
                  message.sender_type === 'assistant' ? 'text-pink-100' : 'text-gray-400'
                }`}>
                  {new Date(message.created_at).toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t p-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="メッセージを入力..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-pink-400"
          />
          <button
            onClick={handleSendMessage}
            className="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition-colors"
          >
            送信
          </button>
        </div>
      </div>
    </main>
  )
}
