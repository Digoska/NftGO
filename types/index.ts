export interface User {
  id: string;
  email: string;
  username: string;
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
  spawn_id?: string;
  spawn_type?: 'personal' | 'global';
  collection_latitude?: number;
  collection_longitude?: number;
  collected_at: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface PersonalSpawn {
  id: string;
  user_id: string;
  nft_id: string;
  latitude: number;
  longitude: number;
  spawn_radius: number;
  created_at: string;
  expires_at: string;
  collected: boolean;
  collected_at?: string;
  nft?: NFT; // Joined NFT details
}

export interface SpawnLocation {
  latitude: number;
  longitude: number;
}
