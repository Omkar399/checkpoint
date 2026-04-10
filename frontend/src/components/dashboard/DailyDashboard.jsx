import { useState, useEffect } from 'react'
import { getDashboard } from '../../api/checkins'
import { getChannelMembers } from '../../api/channels'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function DailyDashboard({ channelId, onUserClick }) {
  const [members, setMembers] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!channelId) return

    setLoading(true)
    Promise.all([getChannelMembers(channelId), getDashboard(channelId)])
      .then(([membersRes, dashboardRes]) => {
        setMembers(membersRes.data || [])
        setDashboard(dashboardRes.data || {})
      })
      .catch(() => {
        // Failed to load dashboard
      })
      .finally(() => {
        setLoading(false)
      })
  }, [channelId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  const checkedInUserIds = new Set(
    (dashboard?.checkins || []).map((c) => c.user_id)
  )

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold uppercase text-[var(--text-muted)] mb-3">
        Today's Check-ins
      </h3>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {members.map((member) => {
          const hasCheckedIn = checkedInUserIds.has(member.user_id || member.id)
          const username = member.username || 'Unknown'
          return (
            <button
              key={member.user_id || member.id}
              onClick={() => onUserClick?.(member.user_id || member.id)}
              className="flex flex-col items-center gap-1 group"
              title={username}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  hasCheckedIn
                    ? 'bg-[var(--success)] text-white ring-2 ring-[var(--success)]/30'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                } group-hover:scale-110`}
              >
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[48px]">
                {username}
              </span>
            </button>
          )
        })}
      </div>

      {members.length === 0 && (
        <p className="text-[var(--text-muted)] text-sm text-center py-4">
          No members in this channel
        </p>
      )}
    </div>
  )
}
