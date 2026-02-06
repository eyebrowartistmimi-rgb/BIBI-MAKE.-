import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    for (const event of body.events || []) {
      if (event.type === 'join' && event.source?.type === 'group') {
        console.log('=== LINE GROUP ID ===')
        console.log('Group ID:', event.source.groupId)
        console.log('====================')
        continue
      }

      if (event.source?.type === 'group') {
        console.log('Message from group:', event.source.groupId)
      }

      if (event.type === 'message' && event.message?.type === 'text') {
        const lineUserId = event.source?.userId
        const messageText = event.message.text

        if (!lineUserId) continue

        const { data: assistant } = await supabase
          .from('assistants')
          .select('id')
          .eq('line_user_id', lineUserId)
          .single()

        if (!assistant) continue

        const { data: chatRoom } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('assistant_id', assistant.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!chatRoom) continue

        await supabase
          .from('messages')
          .insert({
            chat_room_id: chatRoom.id,
            content: messageText,
            sender_type: 'assistant'
          })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook Error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'LINE Webhook is ready' })
}
