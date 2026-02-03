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

    // LINE通知を送信
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
