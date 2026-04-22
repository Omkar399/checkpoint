import { useEffect, useRef, useState, useCallback } from 'react'
import { pollMessages } from '../api/messages'

export default function useWebSocket(channelId, onMessage, onReaction) {
  const [connected, setConnected] = useState(false)
  const [connectionType, setConnectionType] = useState(null)
  const wsRef = useRef(null)
  const pollIntervalRef = useRef(null)
  const lastMessageIdRef = useRef(null)
  const onMessageRef = useRef(onMessage)
  const onReactionRef = useRef(onReaction)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    onReactionRef.current = onReaction
  }, [onReaction])

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    stopPolling()
    setConnectionType('polling')
    setConnected(true)

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await pollMessages(channelId, lastMessageIdRef.current)
        const messages = res.data
        if (messages && messages.length > 0) {
          messages.forEach((msg) => {
            if (onMessageRef.current) {
              onMessageRef.current(msg)
            }
          })
          lastMessageIdRef.current = messages[messages.length - 1].id
        }
      } catch {
        // Polling error, will retry on next interval
      }
    }, 10000)
  }, [channelId, stopPolling])

  useEffect(() => {
    if (!channelId) return

    const token = localStorage.getItem('token')
    if (!token) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/${channelId}?token=${token}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setConnectionType('websocket')
      stopPolling()
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'new_message' && data.message) {
          const msg = data.message
          if (msg.id) lastMessageIdRef.current = msg.id
          if (onMessageRef.current) onMessageRef.current(msg)
        } else if (data.type === 'new_checkin' && data.message) {
          const msg = data.message
          if (onMessageRef.current) onMessageRef.current(msg)
        } else if (
          (data.type === 'reaction_added' || data.type === 'reaction_removed') &&
          onReactionRef.current
        ) {
          onReactionRef.current(data)
        }
        // Ignore user_joined/user_left for now
      } catch {
        // Ignore malformed messages
      }
    }

    ws.onclose = () => {
      setConnected(false)
      setConnectionType(null)
      startPolling()
    }

    ws.onerror = () => {
      ws.close()
    }

    return () => {
      stopPolling()
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      setConnected(false)
      setConnectionType(null)
    }
  }, [channelId, startPolling, stopPolling])

  const sendMessage = useCallback(
    (content) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'send_message', content }))
      }
    },
    []
  )

  const sendCheckin = useCallback(
    (value, note) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'send_checkin', value, note }))
      }
    },
    []
  )

  const sendReaction = useCallback(
    (checkinId, emoji) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'add_reaction', checkin_id: checkinId, emoji }))
      }
    },
    []
  )

  const removeReaction = useCallback(
    (checkinId, emoji) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'remove_reaction', checkin_id: checkinId, emoji }))
      }
    },
    []
  )

  return { sendMessage, sendCheckin, sendReaction, removeReaction, connected, connectionType }
}
