import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { lineUserId, message } = await request.json()

    if (!lineUserId || !message) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [
          {
            type: 'text',
            text: message
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('LINE API Error:', error)
      return NextResponse.json({ error: 'LINE API Error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
