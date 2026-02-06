import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { assistantName, message, chatRoomId } = await request.json()

    const groupId = process.env.LINE_GROUP_ID
    if (!groupId) {
      console.error('LINE_GROUP_ID is not set')
      return NextResponse.json({ error: 'LINE_GROUP_ID not configured' }, { status: 500 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bibimake-tachiai.vercel.app'
    const staffUrl = `${siteUrl}/staff/${encodeURIComponent(assistantName)}/chat/${chatRoomId}`

    const notificationText = `🔔 新着メッセージ\n\n担当: ${assistantName}\nメッセージ: ${message}\n\n▼ 返信はこちら\n${staffUrl}`

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: groupId,
        messages: [
          {
            type: 'text',
            text: notificationText
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('LINE Group API Error:', error)
      return NextResponse.json({ error: 'LINE API Error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
