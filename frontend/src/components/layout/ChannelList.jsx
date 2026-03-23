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
      .catch(() => {
        // Failed to load server data
      })
      .finally(() => {
        setLoading(false)
      })
  }, [serverId])

  const refreshChannels = async () => {
    try {
      const res = await getChannels(serverId)
      setChannels(res.data)
    } catch {
      // Failed to refresh channels
    }
  }

  if (!serverId) {
    return (
      <div className="w-60 bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
        <p className="text-[var(--text-muted)] text-sm px-4 text-center">
          Select a server to get started
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-60 bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
        <div className="w-6 h-6 border-2 border-[var(--text-muted)] border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    )
  }

  const isOwner = server && user && server.owner_id === user.id

  return (
    <>
      <div className="w-60 bg-[var(--bg-secondary)] flex flex-col shrink-0">
        {/* Server header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-[var(--bg-primary)]/50 shadow-sm">
          <h2 className="font-semibold text-[var(--text-primary)] truncate">
            {server?.name}
          </h2>
          <button
            onClick={() => setShowInviteModal(true)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            title="Invite People"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </button>
        </div>

        {/* Channels section */}
        <div className="flex-1 overflow-y-auto pt-4 px-2">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">
              Channels
            </span>
            {isOwner && (
              <button
                onClick={() => setShowCreateChannel(true)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                title="Create Channel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            )}
          </div>

          {channels.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm px-2 py-2">
              No channels yet
            </p>
          ) : (
            channels.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                active={channelId === String(channel.id)}
                onClick={() =>
                  navigate(`/dashboard/server/${serverId}/channel/${channel.id}`)
                }
              />
            ))
          )}
        </div>

        {/* Server info footer */}
        <div className="p-3 border-t border-[var(--bg-primary)]/50">
          {server?.description && (
            <p className="text-xs text-[var(--text-muted)] mb-2 truncate">
              {server.description}
            </p>
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
