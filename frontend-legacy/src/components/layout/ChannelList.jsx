import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getServer } from '../../api/servers'
import { getChannels } from '../../api/channels'
import { useAuth } from '../../context/AuthContext'
import ChannelItem from '../channel/ChannelItem'
import CreateChannelModal from '../channel/CreateChannelModal'
import InviteCodeModal from '../server/InviteCodeModal'

export default function ChannelList() {
  const { serverId, channelId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [server, setServer] = useState(null)
  const [channels, setChannels] = useState([])
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!serverId) return

    setLoading(true)
    Promise.all([getServer(serverId), getChannels(serverId)])
      .then(([serverRes, channelsRes]) => {
        setServer(serverRes.data)
        setChannels(channelsRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [serverId])

  const refreshChannels = async () => {
    try {
      const res = await getChannels(serverId)
      setChannels(res.data)
    } catch { /* ignore */ }
  }

  if (!serverId) {
    return (
      <div className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] flex items-center justify-center shrink-0 p-6">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed">
            Pick a server to <br />
            see your channels.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] shrink-0 p-3 space-y-2">
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-8 w-3/4 mt-4" />
        <div className="skeleton h-8 w-full" />
        <div className="skeleton h-8 w-5/6" />
      </div>
    )
  }

  const isOwner = server && user && server.owner_id === user.id

  return (
    <>
      <div className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] flex flex-col shrink-0">
        {/* Server header */}
        <div className="px-4 py-4 border-b border-[var(--border-subtle)]">
          <div className="eyebrow text-[var(--text-muted)] mb-1.5">SERVER</div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="display text-lg text-[var(--text-primary)] truncate">
              {server?.name}
            </h2>
            <button
              onClick={() => setShowInviteModal(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--lime)] hover:bg-[var(--bg-modifier)] transition-colors shrink-0"
              title="Invite people"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </button>
          </div>
          {server?.description && (
            <p className="text-xs text-[var(--text-muted)] mt-1.5 line-clamp-2">
              {server.description}
            </p>
          )}
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto px-2 py-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="eyebrow text-[var(--text-muted)]">GOALS</span>
            {isOwner && (
              <button
                onClick={() => setShowCreateChannel(true)}
                className="w-6 h-6 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--lime)] hover:bg-[var(--bg-modifier)] transition-colors"
                title="Create channel"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            )}
          </div>

          {channels.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                No channels yet.
                {isOwner && <> <button onClick={() => setShowCreateChannel(true)} className="text-[var(--lime)] hover:underline">Create one →</button></>}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {channels.map((channel) => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  active={channelId === String(channel.id)}
                  onClick={() =>
                    navigate(`/dashboard/server/${serverId}/channel/${channel.id}`)
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateChannelModal
        serverId={serverId}
        isOpen={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        onCreated={refreshChannels}
      />

      <InviteCodeModal
        serverId={serverId}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </>
  )
}
