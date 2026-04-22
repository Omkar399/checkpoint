import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import ActivityHeatmap from './ActivityHeatmap'
import LoadingSpinner from '../ui/LoadingSpinner'
import { getUserProfile, getUserHeatmap } from '../../api/users'

export default function UserProfileModal({ isOpen, onClose, userId, channelId }) {
  const [profile, setProfile] = useState(null)
  const [heatmapData, setHeatmapData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen || !userId) return

    setLoading(true)
    Promise.all([
      getUserProfile(userId),
      getUserHeatmap(userId, channelId),
    ])
      .then(([profileRes, heatmapRes]) => {
        setProfile(profileRes.data)
        setHeatmapData(heatmapRes.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isOpen, userId, channelId])

  const total = heatmapData.reduce((sum, d) => sum + (d.count || 0), 0)
  const activeDays = heatmapData.filter((d) => (d.count || 0) > 0).length

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      {loading ? (
        <div className="py-10"><LoadingSpinner /></div>
      ) : profile ? (
        <div className="space-y-6">
          {/* Header — big avatar + name */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-[var(--bg-tertiary)] text-white flex items-center justify-center display text-4xl">
              {(profile.username || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="eyebrow text-[var(--lime)] mb-1">MEMBER</div>
              <h3 className="display text-3xl text-[var(--text-primary)]">
                @{profile.username}
              </h3>
              {profile.created_at && (
                <p className="mono text-xs text-[var(--text-muted)] mt-1">
                  JOINED · {new Date(profile.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="TOTAL CHECK-INS"
              value={total}
              accent="var(--lime)"
            />
            <StatCard
              label="ACTIVE DAYS / YEAR"
              value={activeDays}
              accent="var(--cyan)"
            />
          </div>

          {/* Heatmap */}
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <div className="eyebrow text-[var(--text-secondary)]">
                {new Date().getFullYear()} · ACTIVITY
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] mono">
                <span>LESS</span>
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--bg-tertiary)]" />
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--lime)]/30" />
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--lime)]/60" />
                <span className="w-2.5 h-2.5 rounded-sm bg-[var(--lime)]" />
                <span>MORE</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <ActivityHeatmap data={heatmapData} />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[var(--text-muted)] text-sm text-center py-4">User not found</p>
      )}
    </Modal>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] relative overflow-hidden">
      <div
        className="absolute top-0 right-0 w-24 h-24 opacity-15 rounded-full blur-2xl pointer-events-none"
        style={{ background: accent }}
      />
      <div className="eyebrow text-[var(--text-muted)] mb-2">{label}</div>
      <div className="display text-3xl mono" style={{ color: accent }}>
        {value}
      </div>
    </div>
  )
}
