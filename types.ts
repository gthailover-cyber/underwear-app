
export type Language = 'en' | 'th';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  sold?: number;     // Added: Number of items sold
  colors?: string[]; // Array of hex codes or color names
  sizes?: string[];  // Array of size codes (S, M, L, XL)
  description?: string;
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
  avatar?: string; // Added avatar field
}

export interface Streamer {
  id: string;
  name: string;
  title: string;
  viewerCount: number;
  coverImage: string;
  youtubeId?: string; // Added for 100% Free Live Streaming via YouTube Embed
  videoUrl?: string; // Added for Direct MP4 Streaming (Professional & Reliable)
  itemCount: number;
  products: Product[];
  isAuction?: boolean; // New flag for Auction mode
  auctionEndTime?: number; // Timestamp for auction end
  auctionStartingPrice?: number; // Starting price for auction
  currentBid?: number; // Added: Current highest bid
  topBidder?: string; // Added: Username of the current top bidder
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
