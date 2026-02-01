import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('LINE Webhook received:', JSON.stringify(body, null, 2))
    
    // イベントを処理
    for (const event of body.events || []) {
      console.log('User ID:', event.source?.userId)
      console.log('Event type:', event.type)
      
      // フォローイベント（友だち追加）の場合
      if (event.type === 'follow') {
        console.log('New follower User ID:', event.source?.userId)
      }
      
      // メッセージイベントの場合
      if (event.type === 'message') {
        console.log('Message from User ID:', event.source?.userId)
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
