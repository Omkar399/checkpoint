import { useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import ChannelList from '../components/layout/ChannelList'
import UserProfileModal from '../components/profile/UserProfileModal'

export default function DashboardPage() {
  const { serverId, channelId } = useParams()
  const [profileUserId, setProfileUserId] = useState(null)

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <ChannelList />

      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-primary)]">
        {channelId ? (
          <Outlet />
        ) : serverId ? (
          <ServerWelcome />
        ) : (
          <RootWelcome />
        )}

        <UserProfileModal
          isOpen={!!profileUserId}
          onClose={() => setProfileUserId(null)}
          userId={profileUserId}
        />
      </div>
    </div>
  )
}

function ServerWelcome() {
  return (
    <div className="flex-1 flex items-center justify-center px-8 py-12 overflow-y-auto">
      <div className="max-w-xl anim-enter-up text-center">
        <div className="eyebrow text-[var(--lime)] mb-3">SERVER DASHBOARD</div>
        <h2 className="display text-5xl text-[var(--text-primary)] mb-4">
          Pick a <span className="italic text-[var(--cyan)]">goal</span>
          <br />to check in on.
        </h2>
        <p className="text-[var(--text-secondary)] leading-relaxed">
          Each channel is one goal with its own streak, leaderboard, and heatmap. Choose one from the left to see today's status.
        </p>
      </div>
    </div>
  )
}

function RootWelcome() {
  return (
    <div className="flex-1 flex items-center justify-center px-8 py-12 overflow-y-auto">
      <div className="max-w-2xl anim-enter-up">
        <div className="eyebrow text-[var(--lime)] mb-4">CHECKPOINT · HOME</div>
        <h1 className="display text-6xl text-[var(--text-primary)] mb-6">
          The streak
          <br />
          <span className="gradient-lime">starts here.</span>
        </h1>
        <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-10 max-w-xl">
          Create a server with a few friends — or join one with an invite code —
          and turn your shared goals into visible, daily momentum.
        </p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)]">
          <span className="flex items-center gap-2">
            <kbd className="mono px-2 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded text-xs text-[var(--text-secondary)]">+</kbd>
            create a server
          </span>
          <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
          <span>or paste an invite link</span>
        </div>
      </div>
    </div>
  )
}
