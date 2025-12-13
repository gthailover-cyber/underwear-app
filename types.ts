
export type Language = 'en' | 'th';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
  size?: string;
  color?: string;
}

export interface Comment {
  id: string;
  username: string;
  message: string;
  isSystem?: boolean;
}

export interface Streamer {
  id: string;
  name: string;
  title: string;
  viewerCount: number;
  coverImage: string;
  itemCount: number;
  products: Product[];
}

export interface UserProfile {
  username: string;
  avatar: string;
  coverImage: string;
  age: number;
  height: number;
  weight: number;
  location: string; // Country, Province
  bio: string;
  favorites: string[]; // Favorite underwear types
  gallery: string[];
}

export interface MessagePreview {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline: boolean;
  isVerified?: boolean;
}

export type MessageType = 'text' | 'image' | 'live_share';

export interface ChatMessage {
  id: string;
  senderId: string; // 'me' or other userId
  text?: string;
  type: MessageType;
  timestamp: string;
  read: boolean;
  // For Live Share
  sharedStreamerId?: string; 
  sharedStreamer?: Streamer; // In a real app, you'd fetch this by ID
}
