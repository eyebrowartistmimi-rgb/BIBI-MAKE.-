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

type Assistant = {
  id: string
  name: string
  notes: string | null
}

export default function ChatRoom() {
  const params = useParams()
  const visitorId = 'visitor_' + Math.random().toString(36).substr(2, 9)
  const assistantId = params.id as string
  
  const [assistant, setAssistant] = useState<Assistant | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [chatRoomId, setChatRoomId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    async function fetchData() {
      if (!assistantId) {
        setLoading(false)
        return
      }

      const { data: assistantData } = await supabase
        .from('assistants')
        .select('*')
        .eq('id', assistantId)
        .single()
      
      if (assistantData) {
        setAssistant(assistantData)
      }

      const { data: newRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          assistant_id: assistantId,
          name: visitorId
        })
        .select()
        .single()

      if (roomError) {
        console.error('チャットルーム作成エラー:', roomError)
        setLoading(false)
        return
      }

      if (newRoom) {
        setChatRoomId(newRoom.id)
      }

      setLoading(false)
    }

    fetchData()
  }, [assistantId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatRoomId) return

    const messageText = newMessage
    setNewMessage('')

    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_room_id: chatRoomId,
        content: messageText,
        sender_type: 'student',
        sender_id: visitorId
      })
      .select()
      .single()

    if (error) {
      console.error('メッセージ送信エラー:', error)
      return
    }

    if (data) {
      setMessages([...messages, data])
    }

    try {
      const { data: assistantData } = await supabase
        .from('assistants')
        .select('line_user_id, name')
        .eq('id', assistantId)
        .single()

      if (assistantData?.line_user_id) {
        await fetch('/api/line-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lineUserId: assistantData.line_user_id,
            message: `📩 新しいメッセージが届きました！\n\n${messageText}\n\n👉 立ち合いサポート予約サイトを確認してください`
          })
        })
      }
    } catch (err) {
      console.error('LINE通知エラー:', err)
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
          <Link href="/" className="mr-4">
            <span className="text-2xl">←</span>
          </Link>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-pink-300 rounded-full flex items-center justify-center mr-3">
              <span className="text-xl">👩</span>
            </div>
            <div>
              <div className="font-bold">{assistant?.name}のチャットルーム</div>
              <div className="text-xs text-pink-100">
                {assistant?.notes || '立ち合いサポート'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-tl-none p-4 max-w-xs shadow">
              <p className="text-gray-800">
                こんにちは！{assistant?.name}のチャットルームへようこそ✨
              </p>
              <p className="text-gray-800 mt-2">
                立ち合いのご予約やご質問はこちらでお気軽にどうぞ！
              </p>
              <div className="text-xs text-gray-400 mt-2">
                {assistant?.name}
              </div>
            </div>
          </div>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_type === 'student' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-2xl p-4 max-w-xs shadow ${
                  message.sender_type === 'student'
                    ? 'bg-pink-500 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 rounded-tl-none'
                }`}
              >
                <p>{message.content}</p>
                <div className={`text-xs mt-2 ${
                  message.sender_type === 'student' ? 'text-pink-100' : 'text-gray-400'
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
