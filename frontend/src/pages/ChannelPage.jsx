import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { getChannel } from '../api/channels'
import { getMessages, sendMessage as sendMessageApi } from '../api/messages'
import { getStreak } from '../api/checkins'
import useWebSocket from '../hooks/useWebSocket'
import MessageFeed from '../components/message/MessageFeed'
import MessageInput from '../components/message/MessageInput'
import CheckInModal from '../components/checkin/CheckInModal'
import UserProfileModal from '../components/profile/UserProfileModal'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function ChannelPage() {
  const { channelId } = useParams()
  const [channel, setChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [streak, setStreak] = useState(0)
  const [profileUserId, setProfileUserId] = useState(null)
  const messagesRef = useRef(messages)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const handleNewMessage = useCallback((data) => {
    setMessages((prev) => {
      // Avoid duplicates
      if (prev.some((m) => m.id === data.id)) return prev
      return [...prev, data]
    })
  }, [])

  const { sendMessage: wsSendMessage, connected, connectionType } = useWebSocket(
    channelId,
    handleNewMessage
  )

  // Load channel info and initial messages
  useEffect(() => {
    if (!channelId) return

    setLoading(true)
    setMessages([])
    setHasMore(true)

    Promise.all([getChannel(channelId), getMessages(channelId), getStreak(channelId)])
      .then(([channelRes, messagesRes, streakRes]) => {
        setChannel(channelRes.data)
        const msgs = messagesRes.data || []
        // Messages come newest-first from API, reverse for display
        setMessages(msgs.reverse())
        setHasMore(msgs.length >= 50)
        setStreak(streakRes.data?.streak || 0)
      })
      .catch(() => {
        // Failed to load channel
      })
      .finally(() => {
        setLoading(false)
      })
  }, [channelId])

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return
    setLoadingMore(true)
    try {
      const oldestId = messages[0]?.id
      const res = await getMessages(channelId, oldestId)
      const olderMessages = (res.data || []).reverse()
      if (olderMessages.length < 50) {
        setHasMore(false)
      }
      if (olderMessages.length > 0) {
        setMessages((prev) => [...olderMessages, ...prev])
      }
    } catch {
      // Failed to load more messages
    } finally {
      setLoadingMore(false)
    }
  }, [channelId, loadingMore, hasMore, messages])

  const handleSend = useCallback(
    async (content) => {
      if (connected && connectionType === 'websocket') {
        wsSendMessage(content)
      } else {
        // Fallback: send via REST API
        try {
          const res = await sendMessageApi(channelId, content)
          handleNewMessage(res.data)
        } catch {
          // Failed to send message
        }
      }
    },
    [channelId, connected, connectionType, wsSendMessage, handleNewMessage]
  )

  const handleCheckinCreated = useCallback((checkinMessage) => {
    if (checkinMessage) {
      handleNewMessage(checkinMessage)
      setStreak((s) => s + 1)
    }
  }, [handleNewMessage])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <div className="h-12 px-4 flex items-center gap-2 border-b border-[var(--bg-primary)]/50 shadow-sm shrink-0">
        <span className="text-[var(--text-muted)] font-medium">#</span>
        <h2 className="font-semibold text-[var(--text-primary)]">
          {channel?.name || 'Channel'}
        </h2>
        {channel?.target_unit && (
          <span className="text-xs text-[var(--text-muted)] ml-2 px-2 py-0.5 bg-[var(--bg-secondary)] rounded">
            Target: {channel.target_label || channel.target_unit}
          </span>
        )}
        {streak > 0 && (
          <span className="text-xs text-[var(--warning)] font-medium ml-2 px-2 py-0.5 bg-[var(--bg-secondary)] rounded">
            {'\u{1F525}'} {streak} day streak
          </span>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'
            }`}
          />
          <span className="text-xs text-[var(--text-muted)]">
            {connected
              ? connectionType === 'websocket'
                ? 'Live'
                : 'Polling'
              : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <MessageFeed
        messages={messages}
        loading={loadingMore}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        onUsernameClick={(userId) => setProfileUserId(userId)}
      />

      {/* Input with check-in button */}
      <MessageInput
        onSend={handleSend}
        channelName={channel?.name}
        onCheckinClick={() => setShowCheckinModal(true)}
      />

      {/* Modals */}
      <CheckInModal
        isOpen={showCheckinModal}
        onClose={() => setShowCheckinModal(false)}
        channelId={channelId}
        channel={channel}
        onCheckinCreated={handleCheckinCreated}
      />

      <UserProfileModal
        isOpen={!!profileUserId}
        onClose={() => setProfileUserId(null)}
        userId={profileUserId}
        channelId={channelId}
      />
    </div>
  )
}
