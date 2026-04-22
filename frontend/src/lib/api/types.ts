export interface User {
  id: number;
  email: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Server {
  id: number;
  name: string;
  description: string | null;
  icon_url: string | null;
  owner_id: number;
  created_at: string;
}

export interface ServerMember {
  id: number;
  user_id: number;
  server_id: number;
  role: string;
  joined_at: string;
  user: User;
}

export interface Channel {
  id: number;
  server_id: number;
  name: string;
  description: string | null;
  target_unit: string | null;
  target_label: string | null;
  created_by: number;
  created_at: string;
}

export interface ChannelMember {
  id: number;
  user_id: number;
  channel_id: number;
  joined_at: string;
  user: User;
}

export interface Message {
  id: number;
  channel_id: number;
  user_id: number;
  content: string;
  message_type: string;
  created_at: string;
  user: User;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  users: string[];
  reacted_by_me: boolean;
}

export interface CheckIn {
  id: number;
  user_id: number;
  channel_id: number;
  value: number | null;
  note: string | null;
  checked_in_at: string;
  user: User;
  reactions: ReactionSummary[];
}

export interface CheckInCreate {
  value?: number | null;
  note?: string | null;
}

export interface DailyStatusEntry {
  user_id: number;
  username: string;
  avatar_url: string | null;
  checked_in: boolean;
  last_checkin_at: string | null;
}

export interface HeatmapEntry {
  date: string;
  count: number;
}

export interface StreakResponse {
  streak: number;
}

export interface LeaderboardRow {
  rank: number;
  user_id: number;
  username: string;
  avatar_url: string | null;
  checkin_count: number;
}

export interface Invite {
  id: number;
  code: string;
  server_id: number;
  created_by: number;
  max_uses: number | null;
  use_count: number;
  expires_at: string | null;
  created_at: string;
}

export interface CreateInviteRequest {
  max_uses?: number | null;
  expires_in_hours?: number | null;
}

export interface CreateChannelRequest {
  name: string;
  description?: string | null;
  target_unit?: string | null;
  target_label?: string | null;
}

export type WsEvent =
  | { type: "new_message"; message: Message }
  | { type: "new_checkin"; message: CheckIn & { message_type: "checkin"; checkin_id: number } }
  | {
      type: "reaction_added";
      checkin_id: number;
      reaction: {
        id: number;
        checkin_id: number;
        user_id: number;
        emoji: string;
        username: string;
      };
    }
  | { type: "reaction_removed"; checkin_id: number; user_id: number; emoji: string }
  | { type: "user_joined"; user_id: number; username: string; channel_id: number }
  | { type: "user_left"; user_id: number; username: string; channel_id: number };
