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
    } catch {
      // Failed to fetch servers
    }
  }, [])

  useEffect(() => {
    fetchServers()
  }, [fetchServers])

  return (
    <>
      <div className="w-[72px] bg-[var(--bg-primary)] flex flex-col items-center py-3 gap-2 overflow-y-auto shrink-0">
        {/* Home button */}
        <button
          onClick={() => navigate('/dashboard')}
          className={`w-12 h-12 flex items-center justify-center rounded-2xl text-lg font-bold transition-all duration-200 ${
            !serverId
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--accent)] hover:rounded-2xl rounded-3xl'
          }`}
          title="Home"
        >
          C
        </button>

        <div className="w-8 h-[2px] bg-[var(--border)] rounded-full my-1" />

        {/* Server list */}
        {servers.map((server) => (
          <ServerIcon
            key={server.id}
            server={server}
            active={serverId === String(server.id)}
            onClick={() => navigate(`/dashboard/server/${server.id}`)}
          />
        ))}

        {/* Create server button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-12 h-12 flex items-center justify-center rounded-3xl bg-[var(--bg-tertiary)] text-[var(--success)] hover:bg-[var(--success)] hover:text-white hover:rounded-2xl transition-all duration-200 text-2xl font-light"
          title="Add a Server"
        >
          +
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User section */}
        <div className="w-12 h-[2px] bg-[var(--border)] rounded-full mb-1" />
        <div
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--accent)] text-white text-sm font-semibold cursor-default"
          title={user?.username}
        >
          {user?.username?.charAt(0).toUpperCase() || '?'}
        </div>
        <button
          onClick={logout}
          className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
          title="Logout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
