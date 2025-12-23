
export type Language = 'en' | 'th';

// New: User Roles
export type UserRole = 'model' | 'organizer' | 'supporter';

export type ApplicationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface ProductVariant {
  id?: string;
  product_id?: string;
  color: string;
  size: string;
  stock: number;
}

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
  type?: 'normal' | 'auction'; // Added: normal or auction product
  seller_id?: string;        // Added: ID of the seller
  variants?: ProductVariant[];
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
  timestamp?: string; // Added timestamp
}

export interface Streamer {
  id: string;
  name: string;
  title: string;
  viewerCount: number;
  likes?: number; // Added: Heart count
  coverImage: string;
  avatar?: string; // Added: Host's avatar image
  youtubeId?: string; // Added for 100% Free Live Streaming via YouTube Embed
  videoUrl?: string; // Added for Direct MP4 Streaming (Professional & Reliable)
  useLiveKit?: boolean; // NEW: Flag to use LiveKit for WebRTC streaming
  itemCount: number;
  products: Product[];
  product_ids?: string[]; // Added: IDs of products selected for this room
  isAuction?: boolean; // New flag for Auction mode
  auctionEndTime?: number; // Timestamp for auction end
  auctionStartingPrice?: number; // Starting price for auction
  currentBid?: number; // Added: Current highest bid
  topBidder?: string; // Added: Username of the current top bidder
  hostId?: string; // Added: ID of the host user
  role?: UserRole; // Added for badges
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  coverImage: string;
  role: UserRole; // Added: User Role
  modelApplicationStatus?: ApplicationStatus; // Added: Application Status
  age: number;
  height: number;
  weight: number;
  location: string; // Country, Province
  bio: string;
  favorites: string[]; // Favorite underwear types
  gallery: string[];
  followers: number; // Added
  following: number; // Added
  rate_onsite?: number;
  rate_event_live?: number;
  rate_product_presentation?: number;
  lastSeenAt?: string;
  is_available?: boolean; // Added: Model availability status (true = available, false = busy)
}

export interface Person {
  id: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  followers?: number;
  role?: UserRole;
  lastSeenAt?: string;
  is_available?: boolean;
}

export interface MessagePreview {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  role?: UserRole; // Added for badges
  lastMessage: string;
  time: string;
  unread: number;
  isOnline: boolean;
  isVerified?: boolean;
  lastSeenAt?: string;
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
  // For Group Chat
  senderName?: string;
  senderAvatar?: string;
}

// Group Chat Types
export interface ChatRoom {
  id: string;
  name: string;
  image: string;
  type: 'public' | 'private';
  hostId: string; // ID of the organizer
  hostName: string;
  hostAvatar?: string; // Added: host avatar URL
  members: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

// Order Types
export type OrderStatus = 'pending' | 'shipping' | 'delivered' | 'cancelled';

export interface OrderTimeline {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface Order {
  id: string;
  items: CartItem[];
  totalPrice: number;
  status: OrderStatus;
  date: string;
  trackingNumber?: string;
  timeline?: OrderTimeline[];
}
export interface ReceivedGift {
  id: string;
  sender_id: string;
  receiver_id: string;
  gift_id: string;
  gift_name: string;
  gift_icon: string;
  price: number;
  created_at: string;
  profiles?: {
    username: string;
    avatar: string;
  };
}

export type NotificationType = 'follow' | 'like' | 'gift' | 'mention' | 'system' | 'room_approval';

export interface AppNotification {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  content: string;
  is_read: boolean;
  created_at: string;
  actor?: {
    username: string;
    avatar: string;
  };
}
