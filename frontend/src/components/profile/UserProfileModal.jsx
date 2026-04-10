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
      .catch(() => {
        // Failed to load profile
      })
      .finally(() => {
        setLoading(false)
      })
  }, [isOpen, userId, channelId])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : profile ? (
        <div className="space-y-4">
          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xl font-semibold">
              {(profile.username || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">
                {profile.username}
              </h3>
              {profile.created_at && (
                <p className="text-xs text-[var(--text-muted)]">
                  Joined {new Date(profile.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Activity heatmap */}
          <div>
            <h4 className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-2">
              Activity
            </h4>
            <ActivityHeatmap data={heatmapData} />
          </div>
        </div>
      ) : (
        <p className="text-[var(--text-muted)] text-sm text-center py-4">
          User not found
        </p>
      )}
    </Modal>
  )
}
