import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getServers } from '../../api/servers'
import ServerIcon from '../server/ServerIcon'
import CreateServerModal from '../server/CreateServerModal'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { serverId } = useParams()
  const [servers, setServers] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchServers = useCallback(async () => {
    try {
      const res = await getServers()
      setServers(res.data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchServers() }, [fetchServers])

  return (
    <>
      <div className="w-[76px] bg-black border-r border-[var(--border-subtle)] flex flex-col items-center py-4 gap-2 overflow-y-auto shrink-0">
        {/* Home / brand */}
        <button
          onClick={() => navigate('/dashboard')}
          className={`
            group relative w-12 h-12 flex items-center justify-center
            font-bold transition-all duration-200
            ${!serverId
              ? 'rounded-[12px] bg-[var(--lime)] text-black shadow-[0_8px_16px_rgba(0,0,0,0.4)]'
              : 'rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:rounded-[12px] hover:bg-[var(--bg-tertiary)] hover:text-white'}
          `}
          title="Home"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>

        <div className="w-7 h-px bg-[var(--border-subtle)] my-1" />

        {/* Server list */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          {servers.map((server) => (
            <ServerIcon
              key={server.id}
              server={server}
              active={serverId === String(server.id)}
              onClick={() => navigate(`/dashboard/server/${server.id}`)}
            />
          ))}
        </div>

        {/* Create server */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-white hover:rounded-[12px] transition-all duration-200"
          title="Create or join a server"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <div className="flex-1" />

        {/* User identity at bottom */}
        <div className="w-7 h-px bg-[var(--border-subtle)] my-1" />
        <div
          className="w-11 h-11 flex items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-white text-sm font-bold"
          title={user?.username}
        >
          {user?.username?.charAt(0).toUpperCase() || '?'}
        </div>
        <button
          onClick={logout}
          className="mt-1 w-10 h-10 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--rose)] hover:bg-[var(--bg-modifier)] transition-colors"
          title="Log out"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      <CreateServerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchServers}
      />
    </>
  )
}
