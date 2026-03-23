import { Outlet, useParams } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import ChannelList from '../components/layout/ChannelList'

export default function DashboardPage() {
  const { channelId } = useParams()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-tertiary)]">
      {/* Servers sidebar - 72px */}
      <Sidebar />

      {/* Channel list - 240px */}
      <ChannelList />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {channelId ? (
          <Outlet />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                No channel selected
              </h3>
              <p className="text-[var(--text-muted)] text-sm">
                Select a channel from the list to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
