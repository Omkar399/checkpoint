import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { getChannel } from '../api/channels'
import { getMessages, sendMessage as sendMessageApi } from '../api/messages'
import { getStreak, createCheckin, getDashboard } from '../api/checkins'
import { addReaction, removeReaction } from '../api/reactions'
import { useAuth } from '../context/AuthContext'
import useWebSocket from '../hooks/useWebSocket'
import MessageFeed from '../components/message/MessageFeed'
import MessageInput from '../components/message/MessageInput'
import CheckInModal from '../components/checkin/CheckInModal'
import UserProfileModal from '../components/profile/UserProfileModal'
import Leaderboard from '../components/leaderboard/Leaderboard'
import DailyDashboard from '../components/dashboard/DailyDashboard'

export default function ChannelPage() {
  const { channelId } = useParams()
  const { user } = useAuth()
  const [channel, setChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [streak, setStreak] = useState(0)
  const [profileUserId, setProfileUserId] = useState(null)
  const [showPanel, setShowPanel] = useState(null)
  const [checkedInToday, setCheckedInToday] = useState(false)

  const handleNewMessage = useCallback((data) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === data.id)) return prev
      return [...prev, data]
    })
  }, [])

  const handleReactionEvent = useCallback((data) => {
    setMessages((prev) =>
      prev.map((msg) => {
        const checkinId = msg.checkin_id || msg.id
        if (checkinId !== data.checkin_id) return msg

        const reactions = [...(msg.reactions || [])]

        if (data.type === 'reaction_added') {
          const existing = reactions.find((r) => r.emoji === data.reaction.emoji)
          if (existing) {
            if (!existing.users.includes(data.reaction.username)) {
              existing.count += 1
              existing.users = [...existing.users, data.reaction.username]
            }
          } else {
            reactions.push({
              emoji: data.reaction.emoji,
              count: 1,
              users: [data.reaction.username],
              reacted_by_me: false,
            })
          }
        } else if (data.type === 'reaction_removed') {
          const idx = reactions.findIndex((r) => r.emoji === data.emoji)
          if (idx !== -1) {
            reactions[idx] = { ...reactions[idx] }
            reactions[idx].count -= 1
            if (reactions[idx].count <= 0) reactions.splice(idx, 1)
          }
        }

        return { ...msg, reactions }
      })
    )
  }, [])

  const { sendMessage: wsSendMessage, sendReaction, removeReaction: wsRemoveReaction, connected, connectionType } = useWebSocket(
    channelId,
    handleNewMessage,
    handleReactionEvent,
  )

  useEffect(() => {
    if (!channelId) return

    setLoading(true)
    setMessages([])
    setHasMore(true)
    setShowPanel(null)

    Promise.all([
      getChannel(channelId),
      getMessages(channelId),
      getStreak(channelId),
      getDashboard(channelId).catch(() => ({ data: [] })),
    ])
      .then(([channelRes, messagesRes, streakRes, dashRes]) => {
        setChannel(channelRes.data)
        const msgs = messagesRes.data || []
        setMessages(msgs.reverse())
        setHasMore(msgs.length >= 50)
        setStreak(streakRes.data?.streak || 0)
        const me = (dashRes.data || []).find((m) => m.user_id === user?.id)
        setCheckedInToday(!!me?.checked_in)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [channelId, user])

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return
    setLoadingMore(true)
    try {
      const oldestId = messages[0]?.id
      const res = await getMessages(channelId, oldestId)
      const olderMessages = (res.data || []).reverse()
      if (olderMessages.length < 50) setHasMore(false)
      if (olderMessages.length > 0) {
        setMessages((prev) => [...olderMessages, ...prev])
      }
    } catch {}
    finally { setLoadingMore(false) }
  }, [channelId, loadingMore, hasMore, messages])

  const handleSend = useCallback(
    async (content) => {
      if (connected && connectionType === 'websocket') {
        wsSendMessage(content)
      } else {
        try {
          const res = await sendMessageApi(channelId, content)
          handleNewMessage(res.data)
        } catch {}
      }
    },
    [channelId, connected, connectionType, wsSendMessage, handleNewMessage]
  )

  const handleCheckinCreated = useCallback((checkinData) => {
    if (checkinData) {
      const msg = {
        id: `checkin-${checkinData.id}`,
        checkin_id: checkinData.id,
        channel_id: checkinData.channel_id,
        user_id: checkinData.user_id,
        value: checkinData.value,
        note: checkinData.note,
        message_type: 'checkin',
        created_at: checkinData.checked_in_at,
        reactions: checkinData.reactions || [],
        user: checkinData.user,
      }
      handleNewMessage(msg)
      setStreak((s) => s + 1)
      setCheckedInToday(true)
    }
  }, [handleNewMessage])

  const handleQuickCheckin = useCallback(async () => {
    try {
      const res = await createCheckin(channelId, { value: null, note: null })
      handleCheckinCreated(res.data)
    } catch {}
  }, [channelId, handleCheckinCreated])

  const handleReact = useCallback(
    (checkinId, emoji) => {
      if (connected && connectionType === 'websocket') sendReaction(checkinId, emoji)
      else addReaction(checkinId, emoji).catch(() => {})
    },
    [connected, connectionType, sendReaction]
  )

  const handleUnreact = useCallback(
    (checkinId, emoji) => {
      if (connected && connectionType === 'websocket') wsRemoveReaction(checkinId, emoji)
      else removeReaction(checkinId, emoji).catch(() => {})
    },
    [connected, connectionType, wsRemoveReaction]
  )

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 relative">
            <svg width="40" height="40" viewBox="0 0 44 44" className="animate-spin" style={{ animationDuration: '0.9s' }}>
              <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border-subtle)" strokeWidth="3" />
              <path d="M 22 4 a 18 18 0 0 1 0 36" fill="none" stroke="var(--lime)" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <p className="eyebrow text-[var(--text-muted)]">LOADING CHANNEL</p>
        </div>
      </div>
    )
  }

  const isBooleanChannel = channel?.target_unit?.toLowerCase() === 'done' ||
    channel?.target_unit?.toLowerCase() === 'boolean' ||
    channel?.target_unit?.toLowerCase() === 'done/not done' ||
    !channel?.target_unit

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1 min-w-0">
        {/* Channel header — editorial */}
        <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center gap-3 shrink-0 bg-[var(--bg-primary)]/80 backdrop-blur-md">
          <div className="w-9 h-9 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--lime)] font-bold shrink-0">
            #
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h2 className="display text-xl text-[var(--text-primary)] truncate">
                {channel?.name || 'channel'}
              </h2>
              {channel?.target_label && (
                <span className="text-xs text-[var(--text-muted)] truncate">
                  · {channel.target_label}
                </span>
              )}
            </div>
            {channel?.target_unit && (
              <div className="eyebrow text-[var(--text-muted)] mt-0.5">
                TARGET · <span className="text-[var(--cyan)]">{channel.target_unit}</span>
              </div>
            )}
          </div>

          {/* Streak badge — hot coral with flame flicker */}
          {streak > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[var(--coral)]/15 to-[var(--amber)]/10 border border-[var(--coral)]/30"
              title={`${streak} day streak`}
            >
              <span className="text-base anim-flicker inline-block">🔥</span>
              <span className="mono text-sm font-bold gradient-heat">{streak}</span>
              <span className="eyebrow text-[var(--text-muted)] text-[9px]">DAYS</span>
            </div>
          )}

          <div className="w-px h-6 bg-[var(--border-subtle)] mx-1" />

          {/* Panel buttons */}
          <button
            onClick={() => setShowPanel(showPanel === 'dashboard' ? null : 'dashboard')}
            className={`
              w-9 h-9 flex items-center justify-center rounded-lg transition-all
              ${showPanel === 'dashboard'
                ? 'bg-[var(--cyan)] text-black'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-modifier)] hover:text-[var(--cyan)]'}
            `}
            title="Today's check-ins"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            onClick={() => setShowPanel(showPanel === 'leaderboard' ? null : 'leaderboard')}
            className={`
              w-9 h-9 flex items-center justify-center rounded-lg transition-all
              ${showPanel === 'leaderboard'
                ? 'bg-[var(--coral)] text-black'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-modifier)] hover:text-[var(--coral)]'}
            `}
            title="Leaderboard"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </button>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 ml-2">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[var(--lime)] shadow-[0_0_8px_var(--lime-glow)]' : 'bg-[var(--rose)]'}`} />
            <span className="eyebrow text-[var(--text-muted)] text-[9px]">
              {connected ? (connectionType === 'websocket' ? 'LIVE' : 'POLL') : 'OFF'}
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
          onReact={handleReact}
          onUnreact={handleUnreact}
        />

        {/* Input */}
        <MessageInput
          onSend={handleSend}
          channelName={channel?.name}
          onCheckinClick={() => setShowCheckinModal(true)}
          isBooleanChannel={isBooleanChannel}
          onQuickCheckin={handleQuickCheckin}
          alreadyCheckedInToday={checkedInToday}
        />
      </div>

      {/* Side panel */}
      {showPanel && (
        <div className="w-72 border-l border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-y-auto shrink-0 anim-enter-up">
          {showPanel === 'leaderboard' && (
            <Leaderboard channelId={channelId} onUserClick={(userId) => setProfileUserId(userId)} />
          )}
          {showPanel === 'dashboard' && (
            <DailyDashboard channelId={channelId} onUserClick={(userId) => setProfileUserId(userId)} />
          )}
        </div>
      )}

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
