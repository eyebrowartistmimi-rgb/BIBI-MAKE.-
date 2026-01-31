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
  const assistantId = params.id as string
  
  const [assistant, setAssistant] = useState<Assistant | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchData() {
      // アシスタント情報を取得
      const { data: assistantData } = await supabase
        .from('assistants')
        .select('*')
        .eq('id', assistantId)
        .single()
      
      if (assistantData) {
        setAssistant(assistantData)
      }

      setLoading(false)
    }

    fetchData()
  }, [assistantId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    // メッセージをローカルに追加（デモ用）
    const tempMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender_type: 'student',
      created_at: new Date().toISOString()
    }
    
    setMessages([...messages, tempMessage])
    setNewMessage('')
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
      {/* ヘッダー */}
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

      {/* チャットエリア */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* ウェルカムメッセージ */}
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

          {/* メッセージ一覧 */}
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

      {/* メッセージ入力エリア */}
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
