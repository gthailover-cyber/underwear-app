
import React, { useState, useEffect } from 'react';
import { MessageCircle, Bell, Menu, Plus, Home, Compass, ShoppingCart, User, Users, MapPin, CreditCard, Wallet, LogOut, ChevronRight, X, Globe, Coins, ArrowLeft, Package, ShoppingBag, Box, LayoutDashboard, Shield, List, UserCog, Video, MessageSquare, BicepsFlexed, Crown, Star, Clock, LockKeyhole, Banknote, Calendar, Gift } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import AuthPage from './components/AuthPage';
import StreamCard from './components/StreamCard';
import LiveRoom from './components/LiveRoom';
import WalletModal from './components/WalletModal';
import LiveSelectionModal from './components/LiveSelectionModal';
import LiveProductSelectionModal from './components/LiveProductSelectionModal';
import LiveAuctionSetupModal from './components/LiveAuctionSetupModal';
import UpgradeOrganizerModal from './components/UpgradeOrganizerModal';
import CreateRoomModal from './components/CreateRoomModal';
import GroupChatRoom from './components/GroupChatRoom';
import OrganizerTools from './components/OrganizerTools';
import JoinRequestModal from './components/JoinRequestModal';
import CountdownOverlay from './components/CountdownOverlay';
import MyEarnings from './components/MyEarnings';
import Discover from './components/Discover';
import Cart from './components/Cart';
import Profile from './components/Profile';
import People from './components/People';
import UserProfileDetail from './components/UserProfileDetail';
import EditProfile from './components/EditProfile';
import UserBadge from './components/UserBadge';
import EditGallery from './components/EditGallery';
import Messages from './components/Messages';
import ChatDetail from './components/ChatDetail';
import MyProducts from './components/MyProducts';
import MyRate from './components/MyRate';
import MyAddress from './components/MyAddress';
import MyPayment from './components/MyPayment';
import MyOrders from './components/MyOrders';
import ModelApplicationModal from './components/ModelApplicationModal';
import StartLiveModal from './components/StartLiveModal';
import UpdatePasswordModal from './components/UpdatePasswordModal';
import CustomerOrders from './components/CustomerOrders';
import Stories from './components/Stories';
import InviteModal from './components/InviteModal';
import LiveConfirmationModal from './components/LiveConfirmationModal';
import { TRANSLATIONS, MOCK_USER_PROFILE, DEFAULT_IMAGES } from './constants';
import { Streamer, Language, CartItem, UserProfile, MessagePreview, Product, Person, ChatRoom, ReceivedGift, AppNotification } from './types';
import { useAlert } from './context/AlertContext';
import { requestForToken } from './lib/firebase';
const HEARTBEAT_INTERVAL = 60 * 1000; // 1 minute
const UI_REFRESH_INTERVAL = 30 * 1000; // 30 seconds

const App: React.FC = () => {
  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [isUpdatePasswordOpen, setIsUpdatePasswordOpen] = useState(false);

  // Data State
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  // UI State
  const [currentStreamer, setCurrentStreamer] = useState<Streamer | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('th');
  const t = TRANSLATIONS[language];
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState<'home' | 'discover' | 'cart' | 'people' | 'profile' | 'all_live' | 'messages' | 'my_products' | 'address' | 'payment' | 'my_orders' | 'organizer_tools' | 'my_rate' | 'my_schedule' | 'my_gifts' | 'customer_orders'>('home');
  const [returnTab, setReturnTab] = useState<string | null>(null); // For navigation history
  const [homeTab, setHomeTab] = useState<'live' | 'rooms' | 'models'>('live'); // New: Sub-tab for Home
  const [selectedChatUser, setSelectedChatUser] = useState<MessagePreview | null>(null);
  const [selectedGroupRoom, setSelectedGroupRoom] = useState<ChatRoom | null>(null);
  const [organizerToolTab, setOrganizerToolTab] = useState<'rooms' | 'members'>('rooms'); // State for organizer tool tab
  const [isStartLiveModalOpen, setIsStartLiveModalOpen] = useState(false);

  // People Tab State
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Modal State
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isLiveSelectionOpen, setIsLiveSelectionOpen] = useState(false);
  const [isProductSelectionOpen, setIsProductSelectionOpen] = useState(false);
  const [isAuctionSetupOpen, setIsAuctionSetupOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isModelApplicationOpen, setIsModelApplicationOpen] = useState(false);

  // Live Setup State
  const [selectionMode, setSelectionMode] = useState<'multiple' | 'single'>('multiple');
  const [auctionSelectedProduct, setAuctionSelectedProduct] = useState<Product | null>(null);
  const [liveSelectedProducts, setLiveSelectedProducts] = useState<Product[]>([]);
  const [liveType, setLiveType] = useState<'selling' | 'auction' | null>(null);
  const [auctionStartingPrice, setAuctionStartingPrice] = useState(0);
  const [auctionDurationMs, setAuctionDurationMs] = useState(0);

  // Countdown State
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [countdownValue, setCountdownValue] = useState(5);

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(MOCK_USER_PROFILE);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingGallery, setIsEditingGallery] = useState(false);

  // Wallet State
  const [walletBalance, setWalletBalance] = useState(0);

  // Approval Request State
  const [pendingJoinRoom, setPendingJoinRoom] = useState<ChatRoom | null>(null);
  const [roomApprovalStatus, setRoomApprovalStatus] = useState<'none' | 'pending' | 'rejected'>('none');
  const [pendingCounts, setPendingCounts] = useState<{ [roomId: string]: number }>({});
  const [myApprovedRoomIds, setMyApprovedRoomIds] = useState<string[]>([]);
  const [roomUnreadCounts, setRoomUnreadCounts] = useState<{ [roomId: string]: number }>({});

  // Gifts State
  const [receivedGifts, setReceivedGifts] = useState<ReceivedGift[]>([]);

  const memoizedUser = React.useMemo(() => session?.user ? {
    id: session?.user?.id,
    username: userProfile.username,
    avatar: userProfile.avatar
  } : undefined, [session?.user?.id, userProfile.username, userProfile.avatar]);

  // Cart State (In real app, fetch from DB order_items with status 'in_cart' if implemented)
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const isOnline = (lastSeenAt?: string) => {
    if (!lastSeenAt) return false;
    const lastSeen = new Date(lastSeenAt).getTime();
    const now = new Date().getTime();
    const diff = now - lastSeen;
    // console.log(`[Status] Checking online status. Diff: ${Math.round(diff/1000)}s`);
    return diff < (10 * 60 * 1000); // 10 minutes threshold for better reliability
  };
  const [activeInvite, setActiveInvite] = useState<any>(null);
  const [activeGoalConfirmation, setActiveGoalConfirmation] = useState<any>(null);

  const fetchFollowing = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('followed_id')
        .eq('follower_id', userId);

      if (data) {
        setFollowingIds(data.map(f => f.followed_id));
      }
    } catch (err) {
      console.error('Error fetching following:', err);
    }
  };
  const fetchNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id (username, avatar, role)
        `)
        .eq('user_id', userId)
        .neq('type', 'message') // ไม่แสดง message ในกระดิ่ง - ให้แสดงที่ chat icon แทน
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const fetchUnreadMessagesCount = async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (!error && count !== null) {
        setUnreadMessagesCount(count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const markNotificationsAsRead = async () => {
    if (!session?.user || notifications.length === 0) return;

    // Only update those that are currently unread
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    setIsNotificationsOpen(false);

    if (notif.type === 'follow' || notif.type === 'like' || notif.type === 'gift') {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', notif.actor_id)
          .single();

        if (profile) {
          const person: Person = {
            id: profile.id,
            username: profile.username,
            avatar: profile.avatar || DEFAULT_IMAGES.AVATAR,
            isOnline: isOnline(profile.last_seen_at),
            followers: profile.followers || 0,
            role: profile.role,
            lastSeenAt: profile.last_seen_at
          };
          setSelectedPerson(person);
          setActiveTab('people');
        }
      } catch (err) {
        console.error('Error handling notification click:', err);
      }
    } else if (notif.type === 'room_approval') {
      setActiveTab('home');
      setHomeTab('rooms');
    } else if (notif.type === 'system') {
      // Typically related to orders
      setActiveTab('profile'); // Let user go to profile to see status or wherever appropriate
    }
  };

  const toggleFollow = React.useCallback(async (followedId: string) => {
    if (!session?.user) {
      showAlert({ message: t.pleaseLoginToFollow || "Please login to follow", type: 'warning' });
      return;
    }

    const isFollowing = followingIds.includes(followedId);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', session?.user?.id)
          .eq('followed_id', followedId);

        if (error) throw error;
        setFollowingIds(prev => prev.filter(id => id !== followedId));
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: session?.user?.id,
            followed_id: followedId
          });

        if (error) {
          // Check if error is missing table
          if (error.code === 'PGRST204' || error.message?.includes('not found')) {
            showAlert({ message: "Database table 'follows' not found. Please run the SQL migration.", type: 'error' });
            return;
          }
          throw error;
        }
        setFollowingIds(prev => [...prev, followedId]);
      }

      // Refresh global data to update follower counts
      if (session?.user?.id) fetchGlobalData(session.user.id);
    } catch (err: any) {
      console.error('Toggle Follow Error:', err);
      showAlert({ message: err.message || "Failed to update follow status", type: 'error' });
    }
  }, [session?.user?.id, followingIds, t]);

  const fetchReceivedGifts = async (userId: string) => {
    console.log('[FetchGifts] Fetching for user:', userId);
    try {
      const { data, error } = await supabase
        .from('received_gifts')
        .select(`
          *,
          profiles:sender_id (username, avatar)
        `)
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false });

      if (data) {
        console.log('[FetchGifts] Data received:', data.length, 'records');
        setReceivedGifts(data as ReceivedGift[]);
      }
      if (error) console.error('[FetchGifts] Error:', error);
    } catch (err) {
      console.error('[FetchGifts] Failed:', err);
    }
  };


  // --- SUPABASE INTEGRATION: Auth & Data ---
  useEffect(() => {
    // 1. Check Session & Handle Recovery Link
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);

      if (session?.user) {
        fetchUserProfile(session?.user?.id, session?.user?.email);
        if (session?.user?.id) fetchGlobalData(session?.user?.id);
      }
    });

    // 2. Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session?.user?.id, session?.user?.email);
        if (session?.user?.id) fetchGlobalData(session?.user?.id);
      }

      // Handle Password Recovery Event
      if (event === 'PASSWORD_RECOVERY') {
        setIsUpdatePasswordOpen(true);
      }
    });

    // 3. Fallback: Manually check URL hash for recovery params
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsUpdatePasswordOpen(true);
    }

    return () => subscription.unsubscribe();

  }, []);

  // --- FIREBASE FCM NOTIFICATIONS ---
  useEffect(() => {
    if (session?.user) {
      // Request FCM Token (เก็บ Token ไว้ส่ง Push)
      requestForToken(session.user.id);
      // หมายเหตุ: ไม่ต้องใช้ onMessageListener เพราะจะทำให้ Notification ซ้ำ
      // Service Worker จะจัดการการแสดง Push แทนทั้งหมด
    }
  }, [session]);

  // --- REFRESH DATA ON TAB CHANGE ---
  useEffect(() => {
    if (activeTab === 'my_gifts' && session?.user?.id) {
      fetchReceivedGifts(session.user.id);
    }
    if (activeTab === 'my_products' && session?.user?.id) {
      fetchGlobalData(session.user.id);
    }
  }, [activeTab, session]);

  // --- REALTIME LISTENER: Auto-refresh when lives start/end ---
  useEffect(() => {
    const channel = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, (payload) => {
        console.log('Realtime Room Update:', payload);
        if (session?.user?.id) {
          fetchGlobalData(session.user.id);
        }
      })
      .subscribe();

    // Realtime listener for chat rooms
    const chatRoomsChannel = supabase
      .channel('public:chat_rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms' }, (payload) => {
        console.log('Realtime Chat Room Update:', payload);
        if (session?.user?.id) {
          fetchGlobalData(session.user.id);
        }
      })
      .subscribe();

    let notificationsChannel: any = null;
    let messagesChannel: any = null;
    let profilesChannel: any = null;
    let heartbeatId: any = null;
    let uiRefreshId: any = null;
    let roomsChannel: any = null;
    let roomMembersChannel: any = null;

    if (session?.user) {
      notificationsChannel = supabase
        .channel('public:notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session?.user?.id}` },
          async (payload) => {
            console.log('New Notification Received:', payload);
            // ไม่แสดง message ในกระดิ่ง - ให้แสดงที่ chat icon แทน
            if (payload.new.type === 'message') return;

            // Fetch full notification data including actor profile
            const { data } = await supabase
              .from('notifications')
              .select('*, actor:actor_id (username, avatar)')
              .eq('id', payload.new.id)
              .single();

            if (data) {
              setNotifications(prev => [data, ...prev].slice(0, 20));

              // Show Invite Modal if it's a room invite
              if (data.type === 'room_invite') {
                setActiveInvite(data);
              } else if (data.type === 'system' && data.metadata?.result === 'success' && data.metadata?.goal_id) {
                // Goal Reached
                setActiveGoalConfirmation(data);
              }
            }
          }
        )
        .subscribe();

      // Listener for unread chat messages
      messagesChannel = supabase
        .channel('public:messages_unread')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${session?.user?.id}` },
          (payload) => {
            console.log('Message change detected for unread count:', payload);
            fetchUnreadMessagesCount(session.user.id);
          }
        )
        .subscribe();

      // Listener for profile updates (to see others go online/offline)
      profilesChannel = supabase
        .channel('public:profiles_status')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles' },
          (payload) => {
            console.log('Profile update detected:', payload.new.id);
            // Throttle or just refresh what's needed
            // For now, refreshing global data is safest
            fetchGlobalData(session.user.id);
          }
        )
        .subscribe();

      // Listener for room updates (bids, viewer counts)
      roomsChannel = supabase
        .channel('public:rooms_updates')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'rooms' },
          (payload) => {
            console.log('Room update detected globally:', payload.new.id, payload.new.current_bid);
            setStreamers(prev => prev.map(s =>
              s.id === payload.new.id
                ? {
                  ...s,
                  currentBid: payload.new.current_bid,
                  topBidder: payload.new.top_bidder_name,
                  viewerCount: payload.new.viewer_count || s.viewerCount,
                  likes: payload.new.likes || s.likes
                }
                : s
            ));
          }
        )
        .subscribe();

      // Listener for room membership changes (for private room approval notifications)
      roomMembersChannel = supabase
        .channel('public:room_members_approval')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'room_members' },
          (payload) => {
            console.log('Room members change detected:', payload);
            if (session?.user?.id) {
              fetchGlobalData(session.user.id);
            }
          }
        )
        .subscribe();

      // Heartbeat for online status
      console.log('[Heartbeat] Starting for:', session.user.id);
      supabase.rpc('update_last_seen');
      heartbeatId = setInterval(() => {
        console.log('[Heartbeat] Updating last seen...');
        supabase.rpc('update_last_seen');
      }, HEARTBEAT_INTERVAL);

      // Periodically refresh UI to update "Online" dots based on current time
      uiRefreshId = setInterval(() => {
        // We need to re-map to re-calculate isOnline based on current time
        setPeople(prev => prev.map(p => ({ ...p, isOnline: isOnline(p.lastSeenAt) })));
        setSelectedChatUser(prev => prev ? { ...prev, isOnline: isOnline(prev.lastSeenAt) } : null);
      }, UI_REFRESH_INTERVAL);
    }

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(chatRoomsChannel);
      if (notificationsChannel) supabase.removeChannel(notificationsChannel);
      if (messagesChannel) supabase.removeChannel(messagesChannel);
      if (profilesChannel) supabase.removeChannel(profilesChannel);
      if (roomsChannel) supabase.removeChannel(roomsChannel);
      if (roomMembersChannel) supabase.removeChannel(roomMembersChannel);

      // Real-time listener for ALL room messages to track unread counts
      const groupMessagesChannel = supabase
        .channel('public:room_messages_all')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'room_messages' },
          (payload) => {
            const newMsg = payload.new;
            // Don't count my own messages
            if (newMsg.sender_id === session?.user?.id) return;

            // Only count if it's a room I'm approved for OR I'm the host
            // (We might need to check against chatRooms state)
            setRoomUnreadCounts(prev => {
              // If I'm already in this room, don't increment
              // We'll check selectedGroupRoom. But since this is a closure, 
              // we might need a ref or functional update that checks another state.
              // Actually, we can use a ref for selectedGroupRoom to be sure.
              // For simplicity, let's just increment and let the room opener clear it.
              const currentCount = prev[newMsg.room_id] || 0;
              return { ...prev, [newMsg.room_id]: currentCount + 1 };
            });
          }
        )
        .subscribe();

      if (heartbeatId) clearInterval(heartbeatId);
      if (uiRefreshId) clearInterval(uiRefreshId);
    };
  }, [session]);

  const fetchGlobalData = async (userId: string) => {
    // 1. Fetch Rooms (Streamers)
    try {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('rooms')
        .select(`
            *,
            profiles:host_id (username, avatar, last_seen_at, role)
          `)
        .or(`last_active_at.gt.${twoMinutesAgo},last_active_at.is.null`)
        .neq('host_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        console.log("DEBUG: Fetched Rooms", data);

        // 1.1 Fetch Products for these hosts (Since we don't have a room_products join table yet, we show all host products)
        const hostIds = data.map((r: any) => r.host_id).filter(Boolean);
        let productsMap: Record<string, Product[]> = {};

        if (hostIds.length > 0) {
          try {
            const { data: productsData } = await supabase
              .from('products')
              .select('*')
              .in('seller_id', hostIds);

            if (productsData) {
              productsData.forEach((p: any) => {
                if (!productsMap[p.seller_id]) productsMap[p.seller_id] = [];
                productsMap[p.seller_id].push(p);
              });
            }
          } catch (err) {
            console.error("Error fetching room products:", err);
          }
        }

        const dbStreamers: Streamer[] = data.map((room: any) => {
          const hostProfile = Array.isArray(room.profiles) ? room.profiles[0] : room.profiles;
          return {
            id: room.id,
            hostId: room.host_id,
            name: hostProfile?.username || 'Unknown Host',
            avatar: hostProfile?.avatar || DEFAULT_IMAGES.AVATAR,
            role: hostProfile?.role,
            title: room.title,
            viewerCount: room.viewer_count || 0,
            likes: room.likes || 0,
            coverImage: room.cover_image || DEFAULT_IMAGES.COVER,
            videoUrl: room.video_url,
            youtubeId: room.youtube_id,
            itemCount: productsMap[room.host_id]?.length || 0,
            products: (productsMap[room.host_id] || []).filter(p =>
              Array.isArray(room.product_ids) && room.product_ids.length > 0
                ? room.product_ids.includes(p.id)
                : true
            ),
            product_ids: room.product_ids,
            isAuction: room.is_auction,
            auctionEndTime: room.auction_end_time ? Number(room.auction_end_time) : undefined,
            auctionStartingPrice: room.auction_starting_price,
            currentBid: room.current_bid,
            topBidder: room.top_bidder_name,
            useLiveKit: !room.video_url && !room.youtube_id,
          };
        });
        setStreamers(dbStreamers);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }

    // 2. Fetch My Products
    try {
      const { data: prodData } = await supabase.from('products').select('*').eq('seller_id', userId);
      if (prodData) setMyProducts(prodData);
    } catch (err) {
      console.error('Error fetching products:', err);
    }

    // 3. Fetch All People (Profiles)
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', userId);
      if (profileData) {
        setPeople(profileData.map(p => ({
          id: p.id,
          username: p.username || 'User',
          avatar: p.avatar || DEFAULT_IMAGES.AVATAR,
          isOnline: isOnline(p.last_seen_at),
          lastSeenAt: p.last_seen_at,
          followers: p.followers || 0,
          role: p.role,
          is_available: p.is_available ?? true,
          rate_event_live: p.rate_event_live || 0
        })));
      }
    } catch (err) {
      console.error('Error fetching people:', err);
    }

    // 4. Fetch Chat Rooms
    try {
      const { data: roomsData, error } = await supabase
        .from('chat_rooms')
        .select('*, host:profiles!host_id(avatar)')
        .order('created_at', { ascending: false });

      if (roomsData && !error) {
        const formattedRooms: ChatRoom[] = roomsData.map((room: any) => ({
          id: room.id,
          name: room.name,
          image: room.image || DEFAULT_IMAGES.COVER,
          type: room.type,
          hostId: room.host_id,
          hostName: room.host_name,
          hostAvatar: Array.isArray(room.host) ? room.host[0]?.avatar : room.host?.avatar,
          members: room.members || 1,
          lastMessage: room.last_message || 'No messages yet',
          lastMessageTime: room.last_message_time
            ? new Date(room.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now'
        }));
        setChatRooms(formattedRooms);

        // Fetch pending counts for organizers
        if (userId) {
          const { data: countsData } = await supabase
            .from('room_members')
            .select('room_id')
            .eq('status', 'pending');

          if (countsData) {
            const counts: { [key: string]: number } = {};
            countsData.forEach((row: any) => {
              counts[row.room_id] = (counts[row.room_id] || 0) + 1;
            });
            setPendingCounts(counts);
          }

          // Fetch my approved memberships
          const { data: myMemberships } = await supabase
            .from('room_members')
            .select('room_id')
            .eq('user_id', userId)
            .eq('status', 'approved');

          if (myMemberships) {
            setMyApprovedRoomIds(myMemberships.map(m => m.room_id));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching chat rooms:', err);
    }

    // 5. Following
    fetchFollowing(userId);

    // 6. Notifications
    fetchNotifications(userId);

    // 7. Unread Chat Messages
    fetchUnreadMessagesCount(userId);
  };


  const fetchUserProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        const safeAvatar = (data.avatar && data.avatar.trim() !== '') ? data.avatar : DEFAULT_IMAGES.AVATAR;
        const safeCover = (data.cover_image && data.cover_image.trim() !== '') ? data.cover_image : DEFAULT_IMAGES.COVER;

        setUserProfile({
          id: data.id,
          username: data.username || email?.split('@')[0] || 'User',
          avatar: safeAvatar,
          coverImage: safeCover,
          role: data.role || 'supporter',
          bio: data.bio || '',
          location: data.location || '',
          age: data.age || 0,
          height: data.height || 0,
          weight: data.weight || 0,
          favorites: data.favorites || [],
          gallery: data.gallery || [],
          followers: data.followers || 0,
          following: data.following || 0,
          rate_event_live: data.rate_event_live,
          rate_product_presentation: data.rate_product_presentation,
          rate_onsite: data.rate_onsite,
          lastSeenAt: data.last_seen_at,
          is_available: data.is_available ?? true // Default to available if not set
        });
        setWalletBalance(data.wallet_balance || 0);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
  };

  const handleOpenStream = (streamer: Streamer) => {
    if (session?.user && streamer.hostId === session.user.id && streamer.id !== currentStreamer?.id) {
      showAlert({ message: language === 'th' ? "คุณไม่สามารถดูไลฟ์ของตัวเองได้" : "You cannot watch your own live stream.", type: 'info' });
      return;
    }
    setCurrentStreamer(streamer);
  };

  const handleCloseStream = React.useCallback(async () => {
    console.log("handleCloseStream Triggered");

    // Check if I am the host
    if (session?.user && currentStreamer) {
      if (currentStreamer.hostId === session.user.id) {
        try {
          const { error } = await supabase.from('rooms').delete().eq('id', currentStreamer.id);
          if (error) {
            console.error("❌ Error deleting room from DB:", error.message);
          }
        } catch (err) {
          console.error("❌ Error running delete command:", err);
        }
      }
    }

    // Always clear local state to close the modal
    setCurrentStreamer(null);
  }, [session?.user, currentStreamer?.id, currentStreamer?.hostId]);

  const handleTopUp = async (amount: number) => {
    setWalletBalance(prev => prev + amount);
    if (session?.user) {
      const { error } = await supabase.rpc('add_coins', {
        user_id: session.user.id,
        amount
      });
      if (error) {
        console.error("Error adding coins:", error);
      }
    }
  };

  const handleUseCoins = React.useCallback(async (amount: number) => {
    setWalletBalance(prev => Math.max(0, prev - amount));
    if (session?.user) {
      const { error } = await supabase.rpc('deduct_coins', {
        user_id: session.user.id,
        amount
      });
      if (error) {
        console.error("Error deducting coins:", error);
      }
    }
  }, [session?.user]);

  // --- PROFILE UPDATE LOGIC ---
  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    // 1. Optimistic Update (Update UI immediately)
    setUserProfile(updatedProfile);
    setIsEditingProfile(false);

    // 2. Database Update
    if (session?.user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            username: updatedProfile.username,
            location: updatedProfile.location,
            bio: updatedProfile.bio,
            avatar: updatedProfile.avatar,
            cover_image: updatedProfile.coverImage,
            age: updatedProfile.age,
            height: updatedProfile.height,
            weight: updatedProfile.weight,
            favorites: updatedProfile.favorites
          })
          .eq('id', session.user.id);

        if (error) throw error;
        console.log("Profile updated successfully in DB");
      } catch (error: any) {
        console.error("Error updating profile in DB:", error.message || error);
        showAlert({ message: "Failed to save changes to the server. " + (error.message || ''), type: 'error' });
      }
    }
  };

  // --- GALLERY UPDATE LOGIC ---
  const handleSaveGallery = async (newGallery: string[]) => {
    // 1. Optimistic Update
    setUserProfile(prev => ({ ...prev, gallery: newGallery }));
    setIsEditingGallery(false);

    // 2. Database Update
    if (session?.user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            gallery: newGallery
          })
          .eq('id', session.user.id);

        if (error) throw error;
        console.log("Gallery updated successfully in DB");
      } catch (error: any) {
        console.error("Error updating gallery in DB:", error.message || error);
        showAlert({ message: "Failed to save gallery changes. Make sure you ran the SQL to add the 'gallery' column.", type: 'error' });
      }
    }
  };

  const handlePlusClick = () => {
    // If Organizer, show Create Group Room modal
    if (userProfile.role === 'organizer') {
      setIsCreateRoomOpen(true);
      return;
    }

    // Only Models can start a live stream
    if (userProfile.role !== 'model') {
      showAlert({
        message: language === 'th'
          ? "เฉพาะนายแบบเท่านั้นที่สามารถเริ่มไลฟ์ได้ กรุณาสมัครเป็นนายแบบก่อน"
          : "Only Models can start a live stream. Please apply to become a Model.",
        type: 'warning'
      });
      setIsMenuOpen(true); // Open menu to guide them to apply
      return;
    }

    // Models go to live selection
    setIsLiveSelectionOpen(true);
  };


  const handleLiveTypeSelect = (type: 'selling' | 'auction') => {
    setLiveType(type);
    setIsLiveSelectionOpen(false);

    if (type === 'selling') {
      setSelectionMode('multiple');
      setIsProductSelectionOpen(true);
    } else {
      // Auction: Must select 1 product first
      setSelectionMode('single');
      setIsProductSelectionOpen(true);
    }
  };

  const handleProductSelectionConfirm = (selectedProducts: Product[]) => {
    setIsProductSelectionOpen(false);

    if (selectionMode === 'multiple') {
      setLiveSelectedProducts(selectedProducts);
      // Go straight to start live modal
      setIsStartLiveModalOpen(true);
    } else {
      if (selectedProducts.length > 0) {
        setLiveSelectedProducts(selectedProducts); // Also set for auction single product
        setAuctionSelectedProduct(selectedProducts[0]);
        setIsAuctionSetupOpen(true);
      }
    }
  };

  const handleAuctionSetupConfirm = (durationMs: number, startingPrice: number) => {
    setAuctionDurationMs(durationMs);
    setAuctionStartingPrice(startingPrice);
    setIsAuctionSetupOpen(false);
    setIsStartLiveModalOpen(true);
  };

  const handleStartStream = async (streamConfig: Streamer) => {
    setIsStartLiveModalOpen(false);

    // Start Countdown
    setIsCountdownActive(true);
    setCountdownValue(5);

    let count = 5;
    const timer = setInterval(async () => {
      count--;
      if (count > 0) {
        setCountdownValue(count);
      } else {
        clearInterval(timer);
        setIsCountdownActive(false);

        // Generate a valid UUID for the room ID (Required by Supabase 'uuid' column type)
        const roomId = crypto.randomUUID();

        // Construct Final Stream Object
        const isAuction = liveType === 'auction';
        const auctionEndTime = isAuction ? Date.now() + (auctionDurationMs || 300000) : undefined;

        const myStream: Streamer = {
          ...streamConfig,
          id: roomId,
          name: userProfile.username,
          coverImage: streamConfig.coverImage || userProfile.coverImage,
          products: liveSelectedProducts.length > 0 ? liveSelectedProducts : myProducts, // Use selected products if available
          product_ids: liveSelectedProducts.map(p => p.id),
          isAuction: isAuction,
          auctionEndTime: auctionEndTime,
          auctionStartingPrice: isAuction ? auctionStartingPrice : undefined,
          currentBid: isAuction ? auctionStartingPrice : 0,
          hostId: session?.user?.id, // Explicitly enforce session ID
        };

        setCurrentStreamer(myStream);

        // SAVE TO SUPABASE DB (So others can see it)
        if (session?.user) {
          console.log("Attempting to insert room into DB...", {
            id: roomId,
            host_id: session?.user?.id,
            title: streamConfig.title
          });

          try {
            const { data, error } = await supabase.from('rooms').insert({
              id: roomId,
              host_id: session?.user?.id,
              title: streamConfig.title || 'Untitled Live',
              cover_image: streamConfig.coverImage || userProfile.coverImage,
              video_url: '', // Empty string instead of null if column is non-nullable text
              youtube_id: '',
              viewer_count: 0,
              is_auction: isAuction,
              auction_end_time: auctionEndTime ? auctionEndTime.toString() : null,
              auction_starting_price: isAuction ? auctionStartingPrice : 0,
              current_bid: isAuction ? auctionStartingPrice : 0,
              product_ids: liveSelectedProducts.map(p => p.id),
              created_at: new Date().toISOString()
            }).select(); // Select to confirm return

            if (error) {
              console.error("❌ Error creating room in DB:", error.message, error.details, error.hint);
              showAlert({ message: `Error starting live in DB: ${error.message}`, type: 'error' });
            } else {
              console.log("✅ Room successfully inserted:", data);
            }
          } catch (err) {
            console.error("❌ Failed to create room (Exception):", err);
          }
        } else {
          console.error("❌ Cannot insert room: User not authenticated session=", session);
          showAlert({ message: "You must be logged in to start a live stream.", type: 'warning' });
        }
      }
    }, 1000);
  };

  const handleAddProductRedirect = () => {
    setIsProductSelectionOpen(false);
    setActiveTab('my_products');
  };

  // Upgrade to Organizer Logic
  const handleConfirmUpgrade = async () => {
    const PRICE = 5000;
    if (walletBalance < PRICE) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // 1. Deduct coins using RPC
      const { error: deductError } = await supabase.rpc('deduct_coins', {
        user_id: user.id,
        amount: PRICE
      });

      if (deductError) throw deductError;

      // 2. Update role to 'organizer' in profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'organizer' })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 3. Update local state
      setWalletBalance(prev => prev - PRICE);
      setUserProfile(prev => ({
        ...prev,
        role: 'organizer'
      }));

      // 4. Success feedback
      showAlert({ message: t.upgradeSuccess, type: 'success' });

    } catch (error: any) {
      console.error('[Upgrade] Error:', error);
      showAlert({ message: 'Failed to upgrade: ' + (error.message || 'Unknown error'), type: 'error' });
    }
  };

  // Model Application Logic
  const handleOpenModelApplication = () => {
    setIsModelApplicationOpen(true);
    setIsMenuOpen(false);
  };

  const handleSubmitModelApplication = async () => {
    // 1. Update local state to immediately reflect 'Model' status
    setUserProfile(prev => ({
      ...prev,
      role: 'model',
      modelApplicationStatus: 'approved'
    }));

    // 2. Feedback
    showAlert({
      message: language === 'th'
        ? "อนุมัติเรียบร้อย! คุณเป็น 'นายแบบ' แล้ว สามารถเริ่มไลฟ์ขายของได้เลย"
        : "Approved! You are now a 'Model' and can start selling.",
      type: 'success'
    });

    // 3. Persist to Supabase
    if (session?.user) {
      try {
        await supabase
          .from('profiles')
          .update({ role: 'model' })
          .eq('id', session.user.id);
      } catch (err) {
        console.error("Error updating role:", err);
      }
    }
  };

  // Room Creation Logic
  const handleCreateRoom = async (newRoom: ChatRoom) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showAlert({ message: 'Please login to create a room', type: 'warning' });
        return;
      }

      // Insert room into Supabase
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: newRoom.name,
          image: newRoom.image,
          type: newRoom.type,
          host_id: user.id,
          host_name: userProfile.username || user.email?.split('@')[0] || 'User',
          members: 1,
          last_message: 'Room created',
          last_message_time: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Format the data to match ChatRoom interface
        const formattedRoom: ChatRoom = {
          id: data.id,
          name: data.name,
          image: data.image,
          type: data.type,
          hostId: data.host_id,
          hostName: data.host_name,
          hostAvatar: userProfile.avatar,
          members: data.members,
          lastMessage: data.last_message,
          lastMessageTime: 'Just now'
        };

        // Add to local state
        setChatRooms(prev => [formattedRoom, ...prev]);

        showAlert({
          message: language === 'th' ? 'สร้างห้องสำเร็จ!' : 'Room created successfully!',
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('[CreateRoom] Error:', error);
      showAlert({
        message: 'Failed to create room: ' + (error.message || 'Unknown error'),
        type: 'error'
      });
    }
  };

  // Cart Logic
  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddToCart = React.useCallback((newItem: CartItem) => {
    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(
        item => item.id === newItem.id && item.color === newItem.color && item.size === newItem.size
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...prev];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        return updatedItems;
      } else {
        return [...prev, newItem];
      }
    });
  }, []);

  const handleCheckout = async () => {
    const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    if (walletBalance < total) {
      showAlert({ message: 'Insufficient Balance. Please Top Up.', type: 'error' });
      setIsWalletOpen(true);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showAlert({ message: 'Please login to checkout.', type: 'warning' });
        return;
      }

      // 1. Fetch Default Address
      const { data: addressData } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!addressData) {
        showAlert({ message: language === 'th' ? 'กรุณาเพิ่มที่อยู่จัดส่งก่อนสั่งซื้อ' : 'Please add a shipping address first.', type: 'warning' });
        setActiveTab('address');
        return;
      }

      const shippingAddress = `${addressData.name} ${addressData.phone}\n${addressData.address} ${addressData.province} ${addressData.postal_code}`;

      // 2. Clear Cart & Deduct Balance UI (Fast response)
      setWalletBalance(prev => prev - total);
      const itemsToOrder = [...cartItems];
      setCartItems([]);

      // 3. Save Order to Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          total_amount: total,
          status: 'shipping',
          shipping_address: shippingAddress
        })
        .select()
        .single();

      if (orderError) throw orderError;

      if (orderData) {
        // 4. Save Order Items
        const itemsToInsert = itemsToOrder.map(item => ({
          order_id: orderData.id,
          product_id: item.id,
          product_name: item.name,
          product_image: item.image,
          quantity: item.quantity,
          price: item.price,
          color: item.color,
          size: item.size,
          seller_id: item.seller_id,
          item_type: item.type || 'normal'
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      showAlert({ message: language === 'th' ? 'ชำระเงินสำเร็จ!' : 'Payment successful!', type: 'success' });

      // Refresh global products/wallet
      if (userProfile.id) {
        fetchGlobalData(userProfile.id);
      }

    } catch (err: any) {
      console.error("Checkout Error:", err);
      showAlert({ message: 'Failed to process order. Please try again.', type: 'error' });
    }
  };

  // Menu items
  const menuItems = [
    { id: 'my_orders', icon: ShoppingBag, label: t.myOrders },
    { id: 'profile', icon: User, label: t.profile },
    { id: 'address', icon: MapPin, label: t.myAddress },
    { id: 'payment', icon: CreditCard, label: t.myPayment },
    { id: 'wallet', icon: Wallet, label: t.myWallet },
  ];

  const handleMenuClick = (id: string) => {
    if (id === 'wallet') {
      setIsWalletOpen(true);
      setIsMenuOpen(false);
    } else if (id === 'my_products') {
      setActiveTab('my_products');
      setIsMenuOpen(false);
    } else if (id === 'profile') {
      setActiveTab('profile');
      setIsMenuOpen(false);
    } else if (id === 'address') {
      setActiveTab('address');
      setIsMenuOpen(false);
    } else if (id === 'payment') {
      setActiveTab('payment');
      setIsMenuOpen(false);
    } else if (id === 'my_orders') {
      setActiveTab('my_orders');
      setIsMenuOpen(false);
      setHasNewOrders(false);
    }
  };

  // Organizer Tools Navigation
  const handleOrganizerToolClick = (tool: 'create' | 'list' | 'members') => {
    if (tool === 'create') {
      setIsCreateRoomOpen(true);
      setIsMenuOpen(false);
    } else if (tool === 'list') {
      setActiveTab('organizer_tools');
      setOrganizerToolTab('rooms');
      setIsMenuOpen(false);
    } else if (tool === 'members') {
      setActiveTab('organizer_tools');
      setOrganizerToolTab('members');
      setIsMenuOpen(false);
    }
  };

  // Chat Navigation Logic
  const handleOpenChat = (user: MessagePreview) => {
    setSelectedChatUser(user);
  };

  const handleCloseChat = () => {
    setSelectedChatUser(null);
    if (returnTab) {
      setActiveTab(returnTab as any);
      setReturnTab(null);
    }
  };

  const handleOpenGroup = async (room: ChatRoom) => {
    // 1. If it's public or I'm the host, just open it
    if (room.type === 'public' || room.hostId === session?.user?.id) {
      setReturnTab(activeTab);
      setSelectedGroupRoom(room);
      setActiveTab('messages');
      // Clear unread count when opening
      setRoomUnreadCounts(prev => ({ ...prev, [room.id]: 0 }));
      return;
    }

    // 2. If it's private, check membership status
    try {
      const { data: membership, error } = await supabase
        .from('room_members')
        .select('status')
        .eq('room_id', room.id)
        .eq('user_id', session?.user?.id)
        .maybeSingle();

      if (membership?.status === 'approved') {
        setReturnTab(activeTab);
        setSelectedGroupRoom(room);
        setActiveTab('messages');
        // Clear unread count when opening
        setRoomUnreadCounts(prev => ({ ...prev, [room.id]: 0 }));
      } else {
        // Not approved or doesn't exist
        setPendingJoinRoom(room);
        setRoomApprovalStatus(membership?.status === 'pending' ? 'pending' : 'none');
      }
    } catch (err) {
      console.error('Error checking room membership:', err);
    }
  };

  const handleRequestJoin = async () => {
    if (!pendingJoinRoom || !session?.user) return;

    try {
      const { error } = await supabase
        .from('room_members')
        .insert({
          room_id: pendingJoinRoom.id,
          user_id: session.user.id,
          status: 'pending'
        });

      if (error) throw error;

      setRoomApprovalStatus('pending');
      showAlert({ message: 'Request sent to host!', type: 'success' });
    } catch (err) {
      console.error('Error requesting join:', err);
      showAlert({ message: 'Failed to send request', type: 'error' });
    }
  };

  const handleCloseGroup = () => {
    setSelectedGroupRoom(null);
    if (returnTab) {
      setActiveTab(returnTab as any);
      setReturnTab(null);
    }
  };

  const handleStartChatFromProfile = (person: Person) => {
    const newChatUser: MessagePreview = {
      id: `chat-${person.id}-${Date.now()}`,
      userId: person.id,
      username: person.username,
      avatar: person.avatar,
      lastMessage: 'Start chatting...',
      time: 'Now',
      unread: 0,
      isOnline: person.isOnline,
      isVerified: false
    };

    setReturnTab(activeTab);
    setSelectedChatUser(newChatUser);
    setActiveTab('messages');
    // Don't clear selectedPerson here, so we can return to it
  };

  const handleOpenProfileById = async (userId: string) => {
    try {
      if (userId === session?.user?.id) {
        setReturnTab(activeTab);
        setActiveTab('profile');
        return;
      }

      // 1. Fetch user data from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        showAlert({ message: 'User profile not found', type: 'error' });
        return;
      }

      // 2. Map profile to Person type
      const person: Person = {
        id: profile.id,
        username: profile.username || 'User',
        avatar: profile.avatar || DEFAULT_IMAGES.AVATAR,
        isOnline: isOnline(profile.last_seen_at),
        lastSeenAt: profile.last_seen_at,
        followers: 0, // In real app, we might want to fetch followers count
        role: profile.role
      };

      // 3. Update states to show profile
      setReturnTab(activeTab);
      setSelectedPerson(person);
      setActiveTab('people');
    } catch (err) {
      console.error('[OpenProfile] Error:', err);
      showAlert({ message: 'Failed to load profile', type: 'error' });
    }
  };

  // --- Helpers for Layout ---
  const isFullScreenTab = activeTab === 'messages' || activeTab === 'all_live' || activeTab === 'my_products' || activeTab === 'address' || activeTab === 'payment' || activeTab === 'my_orders' || activeTab === 'organizer_tools' || activeTab === 'my_rate' || activeTab === 'my_schedule';
  const isPeopleTab = activeTab === 'people';
  const isPeopleDetail = isPeopleTab && selectedPerson !== null;
  const isHomeTab = activeTab === 'home';

  // Decide when to show Top/Bottom Bars
  const showTopNav = !isFullScreenTab && !isPeopleDetail;
  const showBottomNav = !isFullScreenTab && !isPeopleDetail;

  // --- Render Content based on Active Tab ---
  const renderContent = () => {
    // If Chat Detail is open, it overrides the Messages tab content
    if (activeTab === 'messages') {
      if (selectedChatUser) {
        return (
          <ChatDetail
            user={selectedChatUser}
            language={language}
            onBack={handleCloseChat}
            onOpenStream={handleOpenStream}
            currentUserId={session?.user?.id}
          />
        );
      }
      if (selectedGroupRoom) {
        return (
          <GroupChatRoom
            room={selectedGroupRoom}
            language={language}
            onBack={handleCloseGroup}
            currentUser={userProfile.username}
            currentUserId={session?.user?.id}
            walletBalance={walletBalance}
            onUseCoins={handleUseCoins}
            onOpenWallet={() => setIsWalletOpen(true)}
            onUserClick={handleOpenProfileById}
          />
        );
      }
      return (
        <Messages
          language={language}
          onBack={() => setActiveTab('home')}
          onOpenChat={handleOpenChat}
          onOpenGroup={handleOpenGroup}
          chatRooms={chatRooms}
          myApprovedRoomIds={myApprovedRoomIds}
          roomUnreadCounts={roomUnreadCounts}
          userProfile={userProfile}
          onCreateRoom={() => setIsCreateRoomOpen(true)}
          currentUserId={session?.user?.id}
        />
      );
    }

    switch (activeTab) {
      case 'discover':
        return (
          <Discover
            language={language}
            onOpenStream={handleOpenStream}
            streamers={streamers}
            userProfile={userProfile}
            onOpenRoom={(room) => {
              setReturnTab('discover');
              setSelectedGroupRoom(room);
              setActiveTab('messages');
            }}
          />
        );
      case 'cart':
        return (
          <Cart
            language={language}
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={handleCheckout}
            onGoShopping={() => setActiveTab('discover')}
          />
        );
      case 'people':
        if (selectedPerson) {
          return (
            <UserProfileDetail
              language={language}
              person={selectedPerson}
              onBack={() => {
                setSelectedPerson(null);
                if (returnTab) {
                  setActiveTab(returnTab as any);
                  setReturnTab(null);
                }
              }}
              onChat={() => handleStartChatFromProfile(selectedPerson)}
              onFollow={toggleFollow}
              isFollowing={followingIds.includes(selectedPerson.id)}
            />
          );
        }
        return (
          <People
            language={language}
            onUserClick={(person) => setSelectedPerson(person)}
            streamers={streamers}
            people={people}
            onFollow={toggleFollow}
            followingIds={followingIds}
          />
        );
      case 'profile':
        if (isEditingProfile) {
          return (
            <EditProfile
              language={language}
              initialData={userProfile}
              onSave={handleSaveProfile}
              onCancel={() => setIsEditingProfile(false)}
            />
          );
        }
        if (isEditingGallery) {
          return (
            <EditGallery
              language={language}
              initialGallery={userProfile.gallery}
              onSave={handleSaveGallery}
              onCancel={() => setIsEditingGallery(false)}
            />
          );
        }
        return (
          <Profile
            language={language}
            user={userProfile}
            onEdit={() => setIsEditingProfile(true)}
            onEditGallery={() => setIsEditingGallery(true)}
            onUpgrade={() => setIsUpgradeModalOpen(true)}
            onBack={returnTab ? (() => { setActiveTab(returnTab as any); setReturnTab(null); }) : undefined}
          />
        );
      case 'my_products':
        if (userProfile.role !== 'model') {
          return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500 space-y-4">
              <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center border border-gray-800">
                <LockKeyhole size={32} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Access Restricted</h3>
                <p className="text-sm">Only verified models can manage and sell products.</p>
              </div>
              <button onClick={() => setActiveTab('home')} className="px-6 py-2 bg-gray-800 text-white rounded-lg text-sm font-bold border border-gray-700 hover:bg-gray-700">Go Home</button>
            </div>
          );
        }
        return (
          <MyProducts
            language={language}
            onBack={() => setActiveTab('home')}
            products={myProducts}
            setProducts={setMyProducts}
          />
        );
      case 'my_earnings':
        return (
          <MyEarnings
            language={language}
            onBack={() => setActiveTab('home')}
            currentUserId={session?.user?.id}
          />
        );
      case 'my_gifts':
        const totalGiftValue = receivedGifts.reduce((sum, log) => sum + log.price, 0);

        return (
          <div className="pb-24 animate-fade-in bg-black min-h-screen">
            <div className="flex items-center gap-3 px-4 py-4 sticky top-0 bg-black/90 backdrop-blur z-30 border-b border-gray-800">
              <button
                onClick={() => setActiveTab('home')}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
              <h2 className="text-xl font-athletic tracking-wide text-white">{t.myGifts}</h2>
            </div>

            <div className="p-4 flex flex-col gap-4">
              {/* Total Summary Card (Compact) */}
              <div className="bg-gradient-to-br from-yellow-500 via-orange-600 to-red-700 rounded-2xl p-4 shadow-xl shadow-orange-900/30 border border-yellow-400/20 relative overflow-hidden group">
                {/* Decorative Elements */}
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-1000"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-yellow-100/80 text-[20px] font-bold uppercase tracking-[0.2em]">{t.totalEarnings}</p>
                    <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                      <Gift size={16} className="text-yellow-200" />
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-white font-athletic tracking-tight">
                      {totalGiftValue.toLocaleString()}
                    </h3>
                    <Coins size={20} className="text-yellow-300 fill-yellow-300 mb-0.5" />
                  </div>

                  <div className="mt-4 flex items-center gap-6 pt-3 border-t border-white/10">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-yellow-100/60 font-medium uppercase tracking-wider">Gifts Received</span>
                      <span className="text-base font-bold text-white">{receivedGifts.length}</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[9px] text-yellow-100/60 font-medium uppercase tracking-wider">Avg Value</span>
                      <span className="text-base font-bold text-white">
                        {receivedGifts.length > 0 ? Math.round(totalGiftValue / receivedGifts.length) : 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {receivedGifts.map((log) => (
                  <div key={log.id} className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-between border border-white/5 hover:border-yellow-500/30 hover:bg-white/5 transition-all duration-300 group/item">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full ring-2 ring-white/10 ring-offset-2 ring-offset-black overflow-hidden bg-black/40 flex items-center justify-center text-2xl border border-white/10 shrink-0">
                          {log.profiles?.avatar ? (
                            <img src={log.profiles.avatar} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" alt="" />
                          ) : (
                            <span className="grayscale-0 group-hover/item:scale-125 transition-transform duration-500">{log.gift_icon}</span>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-black">
                          <Gift size={10} className="text-black" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-white font-bold text-sm tracking-tight">{log.profiles?.username || 'User'}</span>
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter">Sender</span>
                        </div>
                        <p className="text-gray-400 text-xs text-left">
                          sent <span className="text-yellow-200/90 font-medium">{log.gift_name}</span>
                        </p>
                        <p className="text-[9px] text-gray-600 mt-1 flex items-center gap-1 font-medium uppercase tracking-wider">
                          <Clock size={10} className="opacity-50" /> {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 group-hover/item:border-yellow-500/50 transition-colors">
                        <span className="text-yellow-400 font-black text-sm">+{log.price}</span>
                        <Coins size={14} className="fill-yellow-400 text-yellow-400" />
                      </div>
                    </div>
                  </div>
                ))}

                {receivedGifts.length === 0 && (
                  <div className="text-center py-20 flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-6 border border-gray-800 shadow-inner">
                      <Gift size={32} className="text-gray-700 opacity-50" />
                    </div>
                    <h4 className="text-white font-bold mb-1">No Gifts Yet</h4>
                    <p className="text-gray-500 text-sm max-w-[200px] mx-auto">When your viewers send you gifts during your stream, they will appear here!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'my_rate':
        return (
          <MyRate
            language={language}
            onBack={() => setActiveTab('home')}
          />
        );
      case 'my_schedule':
        return (
          <div className="pb-24 animate-fade-in bg-black min-h-screen flex flex-col">
            <div className="flex items-center gap-3 px-4 py-4 sticky top-0 bg-black/90 backdrop-blur z-30 border-b border-gray-800">
              <button
                onClick={() => setActiveTab('home')}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
              <h2 className="text-xl font-athletic tracking-wide text-white">{t.mySchedule}</h2>
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>My Schedule (Coming Soon)</p>
            </div>
          </div>
        );
      case 'address':
        return (
          <MyAddress
            language={language}
            onBack={() => setActiveTab('home')}
          />
        );
      case 'payment':
        return (
          <MyPayment
            language={language}
            onBack={() => setActiveTab('home')}
          />
        );
      case 'my_orders':
        return (
          <MyOrders
            language={language}
            onBack={() => setActiveTab('home')}
          />
        );
      case 'customer_orders':
        return (
          <CustomerOrders
            language={language}
            onBack={() => setActiveTab('home')}
          />
        );
      case 'organizer_tools':
        return (
          <OrganizerTools
            language={language}
            onBack={() => setActiveTab('home')}
            onCreateRoom={() => setIsCreateRoomOpen(true)}
            chatRooms={chatRooms}
            initialTab={organizerToolTab}
            currentUser={userProfile.username}
            currentUserId={session?.user?.id}
            pendingCounts={pendingCounts}
            onUserClick={handleOpenProfileById}
          />
        );
      case 'all_live':
        return (
          <div className="pb-24 animate-fade-in">
            <div className="flex items-center gap-4 mb-6 sticky top-0 bg-black/80 backdrop-blur z-30 py-4 -mt-4 px-2 border-b border-gray-800">
              <button
                onClick={() => setActiveTab('home')}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
              <h2 className="text-xl font-athletic tracking-wide text-white flex items-center gap-2">
                {t.liveNow}
                <span className="text-red-600 text-sm font-sans font-normal bg-red-900/20 px-2 py-0.5 rounded-full border border-red-900/50">
                  All
                </span>
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2">
              {streamers.map((streamer, index) => (
                <StreamCard
                  key={`${streamer.id}-${index}`}
                  streamer={streamer}
                  onPress={handleOpenStream}
                />
              ))}
            </div>
          </div>
        );
      case 'home':
      default:
        return (
          <>
            {/* Fixed Sub-Tabs */}
            <div className="fixed top-16 left-0 right-0 z-30 bg-black/95 backdrop-blur-md py-1 px-2 border-b border-gray-800/50 shadow-md max-w-lg mx-auto">
              <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
                <button
                  onClick={() => setHomeTab('live')}
                  className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${homeTab === 'live' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <Video size={16} /> <span>{t.homeTabs.live}</span>
                </button>
                <button
                  onClick={() => setHomeTab('rooms')}
                  className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${homeTab === 'rooms' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <MessageSquare size={16} /> <span>{t.homeTabs.rooms}</span>
                </button>
                <button
                  onClick={() => setHomeTab('models')}
                  className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${homeTab === 'models' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <Users size={16} /> <span>{t.homeTabs.models}</span>
                </button>
              </div>
            </div>

            {/* Sub-tab Content */}
            <div className="pt-16 pb-6 animate-fade-in">
              {homeTab === 'live' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2">
                  {streamers.length > 0 ? streamers.map(streamer => (
                    <StreamCard
                      key={streamer.id}
                      streamer={streamer}
                      onPress={handleOpenStream}
                    />
                  )) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                      <Video size={48} className="mb-4 opacity-30" />
                      <p>No live streams found</p>
                    </div>
                  )}
                </div>
              )}

              {homeTab === 'rooms' && (
                <div className="space-y-3 px-2">
                  {chatRooms.length > 0 ? chatRooms.map(room => (
                    <div
                      key={room.id}
                      onClick={() => handleOpenGroup(room)}
                      className="flex items-center gap-4 px-4 py-4 bg-gray-900 border border-gray-800 rounded-2xl cursor-pointer active:scale-95 transition-all hover:border-gray-700"
                    >
                      <div className="relative">
                        <div className="w-14 h-14 rounded-xl bg-gray-800 overflow-hidden border border-gray-700">
                          <img src={room.image} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-0.5 border border-gray-700">
                          {room.type === 'private' ? <Shield size={12} className="text-yellow-500" /> : <Globe size={12} className="text-blue-500" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-white text-base truncate">{room.name}</h3>
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-0.5">{room.lastMessage}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                          <Users size={12} /> {room.members} Members
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                      <MessageSquare size={48} className="mb-4 opacity-30" />
                      <p>No rooms active</p>
                    </div>
                  )}
                </div>
              )}

              {homeTab === 'models' && (() => {
                // Filter available models and shuffle them
                const availableModels = people.filter(p => p.role === 'model' && p.is_available);
                const shuffledModels = [...availableModels].sort(() => Math.random() - 0.5);
                const allModels = people.filter(p => p.role === 'model');

                return (
                  <div className="space-y-8">
                    {/* Available Models - Premium Circular Cards */}
                    {shuffledModels.length > 0 && (
                      <div className="relative">
                        {/* Background Glow Effect */}
                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>

                        <div className="relative px-4">
                          {/* Premium Header */}
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-900/50">
                                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                                </div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-ping"></div>
                              </div>
                              <div>
                                <h3 className="text-base font-black text-white tracking-tight">
                                  {language === 'th' ? 'นายแบบพร้อมให้บริการ' : 'Available Now'}
                                </h3>
                                <p className="text-xs text-green-400 font-medium">
                                  {shuffledModels.length} {language === 'th' ? 'คนออนไลน์' : 'online'}
                                </p>
                              </div>
                            </div>
                            <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                              <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Live</span>
                            </div>
                          </div>

                          {/* Circular Cards Slider */}
                          <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
                            <div className="flex gap-5 pb-4">
                              {shuffledModels.map((person, index) => {
                                const isLive = streamers.some(s => s.name === person.username);
                                return (
                                  <div
                                    key={person.id}
                                    onClick={() => { setSelectedPerson(person); setActiveTab('people'); }}
                                    className="flex-shrink-0 cursor-pointer group"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                  >
                                    {/* Circular Avatar Container */}
                                    <div className="relative w-20 h-20 mb-2">
                                      {/* Outer Glow Ring */}
                                      <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-green-400 via-emerald-500 to-teal-500 opacity-75 group-hover:opacity-100 blur-sm group-hover:blur-md transition-all"></div>

                                      {/* Gradient Ring */}
                                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-green-400 via-emerald-500 to-teal-500 p-[3px] group-hover:scale-110 transition-all duration-300">
                                        <div className="w-full h-full rounded-full bg-gradient-to-b from-gray-900 to-black p-[3px]">
                                          <img
                                            src={person.avatar}
                                            className="w-full h-full rounded-full object-cover"
                                            alt={person.username}
                                          />
                                        </div>
                                      </div>

                                      {/* Live Badge */}
                                      {isLive && (
                                        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-600 text-white text-[9px] font-black px-2 py-1 rounded-full flex items-center gap-1 z-20 shadow-lg shadow-red-900/50 animate-pulse border border-red-400/50">
                                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span> LIVE
                                        </div>
                                      )}

                                      {/* Online Status */}
                                      {!isLive && person.isOnline && (
                                        <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-[3px] border-black shadow-lg shadow-green-500/50 z-10">
                                          <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                                        </div>
                                      )}

                                      {/* Available Badge */}
                                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg shadow-green-900/50 whitespace-nowrap border border-green-400/30">
                                        ✓ {language === 'th' ? 'ว่าง' : 'Available'}
                                      </div>
                                    </div>

                                    {/* Name */}
                                    <div className="text-center max-w-[80px]">
                                      <p className="text-sm font-black text-white truncate mb-0.5">{person.username}</p>
                                      <p className="text-[10px] text-gray-500 font-medium truncate">{person.followers || 0} Followers</p>
                                      {person.rate_event_live && (
                                        <p className="text-[9px] text-yellow-500 font-bold truncate mt-0.5">
                                          ฿{person.rate_event_live.toLocaleString()}/hr
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* All Models - Premium 9:16 Cards Grid */}
                    <div className="relative px-4">
                      {/* Premium Header */}
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg border border-gray-700/50">
                            <Users size={18} className="text-gray-400" />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-white tracking-tight">
                              {language === 'th' ? 'นายแบบทั้งหมด' : 'All Models'}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                              {allModels.length} {language === 'th' ? 'นายแบบ' : 'models'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 9:16 Cards Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        {allModels.length > 0 ? allModels.map((person, index) => {
                          const isLive = streamers.some(s => s.name === person.username);
                          return (
                            <div
                              key={person.id}
                              onClick={() => { setSelectedPerson(person); setActiveTab('people'); }}
                              className="relative aspect-[9/16] bg-gradient-to-b from-gray-800 to-gray-900 cursor-pointer overflow-hidden rounded-2xl group border border-gray-800/50 hover:border-gray-700 transition-all shadow-lg hover:shadow-2xl"
                              style={{ animationDelay: `${index * 30}ms` }}
                            >
                              {/* Image */}
                              <img
                                src={person.avatar}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                alt={person.username}
                              />

                              {/* Gradient Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

                              {/* Model Badge */}
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-xl z-10 bg-gradient-to-br from-white to-gray-200 border-2 border-white/20">
                                <BicepsFlexed size={13} className="text-gray-900" strokeWidth={3} />
                              </div>

                              {/* Live Status */}
                              {isLive && (
                                <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 z-20 shadow-lg shadow-red-900/50 animate-pulse border border-red-400/30">
                                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span> LIVE
                                </div>
                              )}

                              {/* Online Status */}
                              {!isLive && person.isOnline && (
                                <div className="absolute top-2 left-2 w-3 h-3 bg-green-500 rounded-full border-2 border-black shadow-lg shadow-green-500/50 z-10">
                                  <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                                </div>
                              )}

                              {/* Available Badge */}
                              {person.is_available && !isLive && (
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-green-900/50 border border-green-400/30">
                                  ✓ {language === 'th' ? 'ว่าง' : 'Available'}
                                </div>
                              )}

                              {/* Info */}
                              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                                <p className="text-sm font-black text-white truncate mb-0.5 drop-shadow-lg">
                                  {person.username}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-gray-400 font-medium">
                                    {person.followers || 0} Followers
                                  </span>
                                  {person.rate_event_live ? (
                                    <span className="text-[10px] text-yellow-400 font-bold bg-black/40 px-1.5 py-0.5 rounded border border-yellow-500/30">
                                      ฿{person.rate_event_live.toLocaleString()}
                                    </span>
                                  ) : (
                                    person.is_available && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }) : (
                          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                            <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
                              <Users size={32} className="opacity-30" />
                            </div>
                            <p className="font-medium">{language === 'th' ? 'ไม่มีนายแบบ' : 'No models found'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        );
    }
  };

  // If loading session state
  if (loadingSession) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // FORCE LOGIN
  if (!session) {
    return <AuthPage language={language} onLanguageChange={setLanguage} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 text-white font-sans selection:bg-red-500 selection:text-white overflow-hidden">

      {/* Side Menu (Same as before) */}
      <div
        className={`fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMenuOpen(false)}
      />
      <div className={`fixed top-0 left-0 bottom-0 w-[80%] max-w-sm z-[60] bg-gray-900 border-r border-gray-800 shadow-2xl transform transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
          <div className="p-6 pt-12 border-b border-gray-800 bg-gradient-to-b from-black to-gray-900">
            <button onClick={() => setIsMenuOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>

            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className={`w-16 h-16 rounded-full p-[2px] ${userProfile.role === 'organizer' ? 'bg-gradient-to-tr from-yellow-300 via-yellow-500 to-yellow-700 shadow-lg shadow-yellow-900/50' :
                  userProfile.role === 'model' ? 'bg-gradient-to-tr from-blue-400 via-blue-600 to-blue-800 shadow-lg shadow-blue-900/50' :
                    'bg-gradient-to-tr from-gray-600 to-gray-400'
                  }`}>
                  <img src={userProfile.avatar} className="w-full h-full rounded-full border-2 border-black object-cover" alt="Profile" />
                </div>
                {session?.user && (
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse shadow-lg"></span>
                )}
              </div>

              <div className="flex flex-col">
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md w-fit mb-1 border ${userProfile.role === 'organizer' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' :
                  userProfile.role === 'model' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                    'bg-gray-800 border-gray-700 text-gray-400'
                  }`}>
                  {userProfile.role === 'organizer' && <Crown size={10} className="fill-current" />}
                  {userProfile.role === 'model' && <BicepsFlexed size={10} />}
                  {userProfile.role === 'supporter' && <User size={10} />}
                  <span className="text-[9px] font-bold uppercase tracking-wider leading-none pt-0.5">{t.roles[userProfile.role]}</span>
                </div>

                <h2 className="text-xl font-athletic tracking-wide text-white leading-tight">{userProfile.username}</h2>

                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center text-yellow-400 text-xs font-bold">
                    <Wallet size={12} className="mr-1" />
                    {walletBalance.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-gray-500">|</span>
                  <span className="text-[10px] text-gray-500">{t.memberSince}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center mt-4 bg-gray-800 rounded-lg p-1 w-fit">
              <button onClick={() => setLanguage('th')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${language === 'th' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>TH</button>
              <button onClick={() => setLanguage('en')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${language === 'en' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>EN</button>
            </div>

            {/* Model Availability Toggle */}
            {userProfile.role === 'model' && (
              <div className="mt-4 bg-gray-800 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${userProfile.is_available ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-xs font-bold text-white">
                      {language === 'th'
                        ? (userProfile.is_available ? 'เปิดรับงาน' : 'ไม่ว่าง')
                        : (userProfile.is_available ? 'Available' : 'Busy')}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      const newStatus = !userProfile.is_available;
                      setUserProfile(prev => ({ ...prev, is_available: newStatus }));

                      if (session?.user) {
                        try {
                          const { error } = await supabase
                            .from('profiles')
                            .update({ is_available: newStatus })
                            .eq('id', session.user.id);

                          if (error) throw error;
                        } catch (err) {
                          console.error('Error updating availability:', err);
                          setUserProfile(prev => ({ ...prev, is_available: !newStatus }));
                        }
                      }
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors ${userProfile.is_available ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${userProfile.is_available ? 'translate-x-6' : 'translate-x-0'
                      }`}></div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Roles Upgrade Section */}
          <div className="px-4 mt-4 mb-2 grid grid-cols-2 gap-3">
            {userProfile.role !== 'organizer' && (
              <button onClick={() => { setIsUpgradeModalOpen(true); setIsMenuOpen(false); }} className="relative overflow-hidden rounded-xl p-3 bg-gradient-to-br from-yellow-900/40 to-black border border-yellow-600/30 flex flex-col items-center text-center group transition-all hover:border-yellow-500 active:scale-95">
                <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 mb-2 group-hover:scale-110 transition-transform">
                  <Crown size={16} />
                </div>
                <span className="text-[10px] text-yellow-500 uppercase font-bold tracking-wider mb-0.5">{t.roles.organizer}</span>
                <span className="text-xs text-white font-bold">{t.applyNow}</span>
              </button>
            )}

            {userProfile.role !== 'model' && (
              <button
                onClick={userProfile.modelApplicationStatus === 'pending' ? undefined : handleOpenModelApplication}
                className={`relative overflow-hidden rounded-xl p-3 bg-gradient-to-br border flex flex-col items-center text-center group transition-all ${userProfile.modelApplicationStatus === 'pending'
                  ? 'from-gray-800 to-black border-gray-700 cursor-not-allowed opacity-80'
                  : 'from-blue-900/40 to-black border-blue-600/30 hover:border-blue-500 active:scale-95'
                  }`}
              >
                {userProfile.modelApplicationStatus !== 'pending' && (
                  <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-transform ${userProfile.modelApplicationStatus === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-500'
                  : 'bg-blue-500/20 text-blue-500 group-hover:scale-110'
                  }`}>
                  {userProfile.modelApplicationStatus === 'pending' ? <Clock size={16} /> : <BicepsFlexed size={16} />}
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 ${userProfile.modelApplicationStatus === 'pending' ? 'text-yellow-500' : 'text-blue-500'
                  }`}>{t.roles.model}</span>
                <span className={`text-xs font-bold ${userProfile.modelApplicationStatus === 'pending' ? 'text-yellow-100' : 'text-white'
                  }`}>
                  {userProfile.modelApplicationStatus === 'pending' ? t.pendingApproval : t.applyNow}
                </span>
              </button>
            )}
          </div>

          <div className="flex-1 py-4">

            {/* Organizer Tools */}
            {userProfile.role === 'organizer' && (
              <div className="mb-4">
                <div className="px-6 py-2 mt-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Shield size={12} className="text-yellow-500" /> {t.organizerTools}
                </div>
                <button onClick={() => handleOrganizerToolClick('create')} className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-red-900/30 border border-red-500/50 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                      <Plus size={18} className="text-red-500 group-hover:text-white" />
                    </div>
                    <span className="font-medium text-base text-gray-200 group-hover:text-white">{t.createRoom}</span>
                  </div>
                </button>
                <button onClick={() => handleOrganizerToolClick('list')} className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                      <List size={18} className="text-gray-400 group-hover:text-white" />
                    </div>
                    <span className="font-medium text-base text-gray-200 group-hover:text-white">{t.roomList}</span>
                  </div>
                </button>
                <button onClick={() => handleOrganizerToolClick('members')} className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                      <UserCog size={18} className="text-gray-400 group-hover:text-white" />
                    </div>
                    <span className="font-medium text-base text-gray-200 group-hover:text-white">{t.manageMembers}</span>
                  </div>
                </button>
                <button onClick={() => { setActiveTab('my_gifts'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-yellow-900/30 border border-yellow-500/50 flex items-center justify-center group-hover:bg-yellow-600 transition-colors">
                      <Gift size={18} className="text-yellow-500 group-hover:text-white" />
                    </div>
                    <span className="font-medium text-base text-gray-200 group-hover:text-white">{t.myGifts}</span>
                  </div>
                </button>
                <div className="h-px bg-gray-800 mx-6 my-2"></div>
              </div>
            )}

            {/* Model Tools */}
            {userProfile.role === 'model' && (
              <div className="mb-4">
                <div className="px-6 py-2 mt-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <BicepsFlexed size={12} className="text-blue-500" /> Model Tools
                </div>
                <button onClick={() => { setActiveTab('my_products'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-blue-900/30 border border-blue-500/50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                      <Box size={18} className="text-blue-500 group-hover:text-white" />
                    </div>
                    <span className="font-medium text-base text-gray-200 group-hover:text-white">{t.myProducts}</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-600 group-hover:text-white" />
                </button>
                <button onClick={() => { setActiveTab('customer_orders'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-blue-900/30 border border-blue-500/50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                      <ShoppingBag size={18} className="text-blue-500 group-hover:text-white" />
                    </div>
                    <span className="font-medium text-base text-gray-200 group-hover:text-white">{t.customerOrders}</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-600 group-hover:text-white" />
                </button>
                <button onClick={() => { setActiveTab('my_gifts'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-blue-900/30 border border-blue-500/50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                      <Gift size={18} className="text-blue-500 group-hover:text-white" />
                    </div>
                    <span className="font-medium text-base text-gray-200 group-hover:text-white">{t.myGifts}</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-600 group-hover:text-white" />
                </button>
                <button onClick={() => { setActiveTab('my_earnings'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-blue-900/30 border border-blue-500/50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                      <Banknote size={18} className="text-blue-500 group-hover:text-white" />
                    </div>
                    <span className="font-medium text-base text-gray-200 group-hover:text-white">{t.myEarnings}</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-600 group-hover:text-white" />
                </button>
                <button onClick={() => { setActiveTab('my_rate'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-blue-900/30 border border-blue-500/50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                      <Banknote size={18} className="text-blue-500 group-hover:text-white" />
                    </div>
                    <span className="font-medium text-base text-gray-200 group-hover:text-white">{t.myRate}</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-600 group-hover:text-white" />
                </button>
                <button onClick={() => { setActiveTab('my_schedule'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-blue-900/30 border border-blue-500/50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                      <Calendar size={18} className="text-blue-500 group-hover:text-white" />
                    </div>
                    <span className="font-medium text-base text-gray-200 group-hover:text-white">{t.mySchedule}</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-600 group-hover:text-white" />
                </button>
                <div className="h-px bg-gray-800 mx-6 my-2"></div>
              </div>
            )}

            {/* Menu Items */}
            {menuItems.map((item, index) => (
              <button key={index} onClick={() => handleMenuClick(item.id)} className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                    <item.icon size={20} className="text-white" />
                  </div>
                  <span className="font-medium text-lg text-gray-200 group-hover:text-white">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.id === 'my_orders' && hasNewOrders && (
                    <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-sm shadow-red-500/50"></div>
                  )}
                  <ChevronRight size={18} className="text-gray-600 group-hover:text-white" />
                </div>
              </button>
            ))}
          </div>

          <div className="p-6 border-t border-gray-800 bg-black/20">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all font-bold">
              <LogOut size={20} /><span>{t.logout}</span>
            </button>
            <p className="text-center text-[10px] text-gray-600 mt-4 uppercase tracking-widest">Version 1.0.3</p>
          </div>
        </div>
      </div>

      {/* FIXED TOP NAV BAR */}
      {showTopNav && (
        <div className="fixed top-0 left-0 right-0 mx-auto max-w-lg z-40 bg-black/95 backdrop-blur-md px-4 py-3 border-b border-gray-800 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMenuOpen(true)} className="active:scale-90 transition-transform relative">
              <Menu className="text-white" size={24} />
              {hasNewOrders && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-black animate-pulse"></span>
              )}
            </button>
            <h1 className="text-lg font-bold font-athletic text-white tracking-wider flex items-center">
              GunderWear<span className="text-red-600">.LIVE</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsWalletOpen(true)}
              className="flex items-center gap-1.5 bg-gray-800 rounded-full pl-2 pr-3 py-1 border border-gray-700 hover:border-yellow-500 transition-colors active:scale-95"
            >
              <Coins size={16} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold text-white font-athletic">{walletBalance.toLocaleString()}</span>
            </button>

            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                if (!isNotificationsOpen) markNotificationsAsRead();
              }}
              className="relative p-1 hover:text-gray-300 transition-colors"
            >
              <Bell size={22} className="text-white" />
              {notifications.some(n => !n.is_read) && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-red-600 rounded-full border border-black flex items-center justify-center text-[8px] font-bold text-white px-0.5 animate-pulse">
                  {notifications.filter(n => !n.is_read).length > 9 ? '9+' : notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>

            <button onClick={() => setActiveTab('messages')} className="relative p-1 hover:text-gray-300 transition-colors">
              <MessageCircle size={22} className="text-white" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-blue-500 rounded-full border border-black flex items-center justify-center text-[8px] font-bold text-white px-0.5 animate-pulse">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`h-full overflow-y-auto no-scrollbar mx-auto max-w-lg border-x border-gray-900 ${showTopNav ? 'pt-[64px]' : ''} ${showBottomNav ? 'pb-[80px]' : ''}`}>
        {renderContent()}
      </div>

      {/* FIXED BOTTOM NAV BAR */}
      {showBottomNav && (
        <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-lg z-40 bg-black/95 backdrop-blur-lg border-t border-gray-800 px-2 py-2 flex justify-around items-end pb-safe">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 flex flex-col items-center gap-1 transition-all duration-200 active:scale-90 ${activeTab === 'home' ? 'text-red-600' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{t.home}</span>
          </button>

          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 flex flex-col items-center gap-1 transition-all duration-200 active:scale-90 ${activeTab === 'discover' ? 'text-red-600' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Compass size={24} strokeWidth={activeTab === 'discover' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{t.discover}</span>
          </button>

          {/* Center Button (Conditional) */}
          {(userProfile.role === 'model' || userProfile.role === 'organizer') && (
            <div className="flex-1 flex justify-center -mt-6">
              <button
                onClick={handlePlusClick}
                className="w-14 h-14 bg-gradient-to-tr from-red-600 to-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-900/50 border-4 border-black active:scale-95 transition-transform"
              >
                <Plus size={28} strokeWidth={3} />
              </button>
            </div>
          )}

          <button
            onClick={() => setActiveTab('people')}
            className={`flex-1 flex flex-col items-center gap-1 transition-all duration-200 active:scale-90 ${activeTab === 'people' ? 'text-red-600' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Users size={24} strokeWidth={activeTab === 'people' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{t.people}</span>
          </button>

          <button
            onClick={() => setActiveTab('cart')}
            className={`flex-1 flex flex-col items-center gap-1 relative transition-all duration-200 active:scale-90 ${activeTab === 'cart' ? 'text-red-600' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <div className="relative">
              <ShoppingCart size={24} strokeWidth={activeTab === 'cart' ? 2.5 : 2} />
              {cartItems.length > 0 && <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center font-bold px-1 border border-black">{cartItems.length}</span>}
            </div>
            <span className="text-[10px] font-bold">{t.cart}</span>
          </button>
        </div>
      )}

      {/* Overlays / Modals */}
      {currentStreamer && (
        <LiveRoom
          streamer={currentStreamer}
          isHost={currentStreamer.hostId === session?.user?.id}
          onClose={handleCloseStream}
          language={language}
          walletBalance={walletBalance}
          onUseCoins={handleUseCoins}
          onOpenWallet={() => setIsWalletOpen(true)}
          onAddToCart={handleAddToCart}
          onNewOrder={() => { setHasNewOrders(true); setCartItems([]); }}
          currentUser={memoizedUser}
          onFollow={toggleFollow}
          followingIds={followingIds}
        />
      )}

      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        balance={walletBalance}
        onTopUp={handleTopUp}
        language={language}
      />

      <LiveSelectionModal
        isOpen={isLiveSelectionOpen}
        onClose={() => setIsLiveSelectionOpen(false)}
        onSelect={handleLiveTypeSelect}
        language={language}
      />

      <LiveProductSelectionModal
        isOpen={isProductSelectionOpen}
        onClose={() => setIsProductSelectionOpen(false)}
        products={liveType === 'auction'
          ? myProducts.filter(p => p.type === 'auction')
          : myProducts.filter(p => p.type !== 'auction')
        }
        onConfirm={handleProductSelectionConfirm}
        onAddProductRedirect={handleAddProductRedirect}
        language={language}
        selectionMode={selectionMode}
        liveType={liveType}
      />

      <LiveAuctionSetupModal
        isOpen={isAuctionSetupOpen}
        onClose={() => setIsAuctionSetupOpen(false)}
        onConfirm={handleAuctionSetupConfirm}
        language={language}
        product={auctionSelectedProduct}
      />

      <UpgradeOrganizerModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        language={language}
        walletBalance={walletBalance}
        onConfirmUpgrade={handleConfirmUpgrade}
        onTopUpRedirect={() => { setIsUpgradeModalOpen(false); setIsWalletOpen(true); }}
      />

      <ModelApplicationModal
        isOpen={isModelApplicationOpen}
        onClose={() => setIsModelApplicationOpen(false)}
        onSubmit={handleSubmitModelApplication}
        language={language}
      />

      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        language={language}
        onClose={() => setIsCreateRoomOpen(false)}
        onCreate={handleCreateRoom}
        username={userProfile.username}
      />

      {isStartLiveModalOpen && (
        <StartLiveModal
          language={language}
          onClose={() => setIsStartLiveModalOpen(false)}
          onStart={handleStartStream}
        />
      )}

      <UpdatePasswordModal
        isOpen={isUpdatePasswordOpen}
        onClose={() => setIsUpdatePasswordOpen(false)}
        language={language}
      />

      {/* Notifications Overlay */}
      {isNotificationsOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]"
            onClick={() => setIsNotificationsOpen(false)}
          />
          <div className="fixed top-16 right-4 left-4 max-w-sm mx-auto z-[51] bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-800 shadow-2xl animate-in fade-in zoom-in duration-200 origin-top overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/20">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Bell size={16} className="text-red-600" />
                {t.notifications}
              </h3>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto no-scrollbar py-2">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer border-l-2 ${notif.is_read ? 'border-transparent' : 'border-red-600 bg-red-600/5'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden flex-shrink-0 border border-gray-700 relative">
                      <img
                        src={notif.image_url || notif.actor?.avatar || DEFAULT_IMAGES.AVATAR}
                        className="w-full h-full object-cover"
                        alt="Notification Image"
                      />
                      {notif.actor?.role && (
                        <UserBadge
                          role={notif.actor.role}
                          size="xs"
                          className="absolute -top-0.5 -right-0.5"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 leading-tight">
                        <span className="font-bold text-white transition-colors hover:text-red-500">
                          {notif.actor?.username || 'Someone'}
                        </span>
                        {' '}{notif.content.replace(notif.actor?.username || '', '').trim()}
                      </p>
                      <span className="text-[10px] text-gray-500 mt-1 block">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {notif.type === 'follow' && (
                      <div className="bg-red-600/20 p-1.5 rounded-lg self-start">
                        <Users size={12} className="text-red-500" />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-3">
                    <Bell size={24} className="opacity-20" />
                  </div>
                  <p className="text-sm">{t.noNotifications || 'No notifications yet'}</p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="w-full p-3 text-center text-xs font-bold text-gray-500 hover:text-white border-t border-gray-800 bg-black/20 transition-colors"
              >
                {t.close || 'Close'}
              </button>
            )}
          </div>
        </>
      )}

      <CountdownOverlay
        count={countdownValue}
        isActive={isCountdownActive}
        language={language}
      />

      {/* Approval Modal */}
      {pendingJoinRoom && (
        <JoinRequestModal
          room={{
            id: pendingJoinRoom.id,
            name: pendingJoinRoom.name,
            image: pendingJoinRoom.image,
            host_name: pendingJoinRoom.hostName
          }}
          status={roomApprovalStatus}
          onClose={() => setPendingJoinRoom(null)}
          onRequestJoin={handleRequestJoin}
        />
      )}

      {/* Invite Modal */}
      {activeInvite && (
        <InviteModal
          invite={activeInvite}
          onAccept={async (invite: any) => {
            // Update invite status in room_invites and maybe join room automatically
            if (invite.metadata?.invite_id) {
              await supabase.from('room_invites').update({ status: 'accepted' }).eq('id', invite.metadata.invite_id);
            }
            setActiveInvite(null);
            // Optional: Auto join room logic here
            if (invite.metadata?.room_id) {
              const { data: roomData } = await supabase.from('chat_rooms').select('*').eq('id', invite.metadata.room_id).single();
              if (roomData) {
                // Standardize room data and set as selected
                const formattedRoom: ChatRoom = {
                  id: roomData.id,
                  name: roomData.name,
                  image: roomData.image || DEFAULT_IMAGES.COVER,
                  type: roomData.type,
                  hostId: roomData.host_id,
                  hostName: '', // Will be fetched inside GroupChatRoom or we fetch active host here
                  members: roomData.members || 1
                };
                setSelectedGroupRoom(formattedRoom);
              }
            }
          }}
          onDecline={async (invite: any) => {
            if (invite.metadata?.invite_id) {
              await supabase.from('room_invites').update({ status: 'rejected' }).eq('id', invite.metadata.invite_id);
            }
            setActiveInvite(null);
            showAlert({ message: 'Invitation declined', type: 'info' });
          }}
        />
      )}

      {/* Live Confirmation Modal */}
      {activeGoalConfirmation && (
        <LiveConfirmationModal
          notification={activeGoalConfirmation}
          onClose={() => setActiveGoalConfirmation(null)}
          onConfirm={async () => {
            // Here we should probably trigger the "Start Live" flow or navigate to the room as a Host
            // For now, let's just close and show success.
            // Ideally, we redirect to 'LIVE' tab or open 'StartLiveModal' pre-filled?
            // The user requirement says: "If yes, enter live"

            // Assuming we just close this and user initiates live, OR we auto-navigate.
            setActiveGoalConfirmation(null);
            showAlert({ message: 'Live Confirmed! setting up...', type: 'success' });

            // Navigate to the room to start live stream
            const roomId = activeGoalConfirmation.metadata?.room_id;
            if (roomId) {
              const { data: roomData } = await supabase.from('chat_rooms').select('*').eq('id', roomId).single();
              if (roomData) {
                // If user is hosting, they might need to go to specific live screen
                // For simplicity, select the room which will open GroupChatRoom
                // GroupChatRoom usually has "Start Live" button for host.
                const formattedRoom: ChatRoom = {
                  id: roomData.id,
                  name: roomData.name,
                  image: roomData.image || DEFAULT_IMAGES.COVER,
                  type: roomData.type,
                  hostId: roomData.host_id,
                  hostName: '',
                  members: roomData.members || 1
                };
                setSelectedGroupRoom(formattedRoom);
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default App;
