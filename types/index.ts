export interface User {
  id: string;
  email?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  x_username?: string;
  description?: string;
  x_connected_at?: string;
  created_at: string;
}

export interface NFT {
  id: string;
  name: string;
  description: string;
  image_url: string;
  media_type?: 'image' | 'video' | 'model' | 'gif';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  latitude: number;
  longitude: number;
  spawn_time?: string;
  expires_at?: string;
  created_at: string;
}

export interface UserNFT {
  id: string;
  user_id: string;
  nft_id: string;
  collected_at: string;
  nft?: NFT;
}

export interface UserStats {
  user_id: string;
  total_nfts: number;
  common_count: number;
  rare_count: number;
  epic_count: number;
  legendary_count: number;
  level: number;
  experience: number;
  daily_streak?: number;
  last_collection_date?: string;
  total_distance_km?: number;
  nfts_today?: number;
  nfts_this_week?: number;
  coins?: number;
  rank?: number;
  weekly_reset_date?: string;
  updated_at?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface AppUpdate {
  id: string;
  title: string;
  description?: string;
  full_description?: string;
  image_url?: string;
  type: 'announcement' | 'event' | 'update';
  is_active: boolean;
  priority: number;
  action_url?: string;
  section_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardUser {
  user_id: string;
  username?: string;
  avatar_url?: string;
  total_nfts: number;
  level: number;
  experience: number;
  rank: number;
}

export interface Badge {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon_name: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'exclusive';
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badge?: Badge;
}

