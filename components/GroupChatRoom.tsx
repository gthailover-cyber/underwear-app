
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Send, Plus, Smile, Users, Lock, Globe, Gift, Coins, X, Check, Crown, BicepsFlexed, Ban, VolumeX, Volume2, Clock } from 'lucide-react';
import { ChatRoom, ChatMessage, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { useAlert } from '../context/AlertContext';
import { DEFAULT_IMAGES } from '../constants';
import UserBadge from './UserBadge';

interface GroupChatRoomProps {
  room: ChatRoom;
  language: Language;
  onBack: () => void;
  currentUser: string;
  currentUserId?: string;
  walletBalance: number;
  onUseCoins: (amount: number) => Promise<void>;
  onOpenWallet: () => void;
  onUserClick: (userId: string) => void;
}

// Simple gift list for chat room
const GIFTS = [
  { id: 1, name: 'Rose', price: 1, icon: '🌹' },
  { id: 2, name: 'Heart', price: 10, icon: '💖' },
  { id: 3, name: 'Beer', price: 20, icon: '🍺' },
  { id: 4, name: 'Trophy', price: 100, icon: '🏆' },
];

const GroupChatRoom: React.FC<GroupChatRoomProps> = ({
  room,
  language,
  onBack,
  currentUser,
  currentUserId,
  walletBalance,
  onUseCoins,
  onOpenWallet,
  onUserClick
}) => {
  const t = TRANSLATIONS[language];
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState<'chat' | 'members'>('chat');
  const isHost = currentUserId === room.hostId;
  const [showGifts, setShowGifts] = useState(false);
  const [giftAnimation, setGiftAnimation] = useState<{ id: number; icon: string; name: string; sender: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [bannedMembers, setBannedMembers] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [currentUserIdState, setCurrentUserIdState] = useState<string | null>(null);
  const [showAvailableModels, setShowAvailableModels] = useState(false);
  const [availableModelsStore, setAvailableModelsStore] = useState<any[]>([]);
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);
  const [isViewingGallery, setIsViewingGallery] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [selectedModelsForPoll, setSelectedModelsForPoll] = useState<string[]>([]);
  const [activePoll, setActivePoll] = useState<any | null>(null);
  const [pollVotes, setPollVotes] = useState<Record<string, number>>({});
  const [userVote, setUserVote] = useState<string | null>(null);
  const [pollModels, setPollModels] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [activeGoal, setActiveGoal] = useState<any | null>(null);
  const [goalTimeLeft, setGoalTimeLeft] = useState<number>(0);
  const [goalModel, setGoalModel] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  // Auto-join room and fetch data
  useEffect(() => {
    const initRoom = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Set current user ID for message alignment
        setCurrentUserIdState(user.id);

        // Check if already a member
        const { data: existingMember } = await supabase
          .from('room_members')
          .select('*')
          .eq('room_id', room.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!existingMember && room.type === 'public' && user.id !== room.hostId) {
          // Auto-join public room (except for host who is host)
          const { error } = await supabase
            .from('room_members')
            .insert({
              room_id: room.id,
              user_id: user.id
            });

          if (!error) {
            setIsMember(true);
            setIsMuted(false);
            setIsBanned(false);
            console.log('[Room] Auto-joined public room');
          }
        } else if (existingMember) {
          setIsMember(true);
          setIsMuted(existingMember.is_muted);
          setIsBanned(existingMember.is_banned);
        }

        // Fetch messages
        await fetchMessages();

        // Fetch members
        await fetchMembers();

      } catch (error) {
        console.error('[Room] Init error:', error);
      }
    };

    initRoom();

    // Realtime listener for new messages
    const messagesChannel = supabase
      .channel(`room_messages:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${room.id}`
        },
        async (payload) => {
          console.log('[Room] New message:', payload);

          // Fetch full message with sender profile
          const { data } = await supabase
            .from('room_messages')
            .select(`
              *,
              sender:sender_id (username, avatar)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const newMsg: ChatMessage = {
              id: data.id,
              senderId: data.sender_id,
              senderName: data.sender?.username || 'User',
              senderAvatar: data.sender?.avatar || DEFAULT_IMAGES.AVATAR,
              text: data.content,
              type: 'text',
              timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: true
            };
            setMessages(prev => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    // Realtime listener for moderation updates
    const moderationChannel = supabase
      .channel(`room_moderation:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${room.id}`
        },
        async (payload) => {
          console.log('[Room] Moderation update:', payload);
          const { data: { user } } = await supabase.auth.getUser();
          if (user && payload.new.user_id === user.id) {
            setIsMuted(payload.new.is_muted);
            setIsBanned(payload.new.is_banned);

            if (payload.new.is_banned) {
              showAlert({ message: 'You have been banned from this room.', type: 'error' });
            } else if (payload.new.is_muted) {
              showAlert({ message: 'You have been muted by the host.', type: 'warning' });
            }
          }
          fetchMembers();
        }
      )
      .subscribe();

    // Realtime listener for room updates (member count)
    const roomChannel = supabase
      .channel(`chat_room:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_rooms',
          filter: `id=eq.${room.id}`
        },
        (payload) => {
          console.log('[Room] Room updated:', payload);
          if (payload.new.members !== undefined) {
            // Update local room state if needed
            room.members = payload.new.members;
          }
        }
      )
      .subscribe();

    // Poll & Voting Realtime
    const pollChannel = supabase
      .channel(`room_polls:${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_polls', filter: `room_id=eq.${room.id}` },
        payload => {
          if (payload.eventType === 'INSERT') {
            fetchActivePoll();
          } else if (payload.eventType === 'UPDATE' && payload.new.status === 'ended') {
            setActivePoll(null);
          }
        }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_poll_votes' },
        payload => {
          if (activePoll && payload.new.poll_id === activePoll.id) {
            setPollVotes(prev => ({
              ...prev,
              [payload.new.model_id]: (prev[payload.new.model_id] || 0) + 1
            }));
          }
        }
      )
      .subscribe();

    // Donation Goal Realtime
    const goalChannel = supabase
      .channel(`room_goals:${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_donation_goals', filter: `room_id=eq.${room.id}` },
        payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            fetchActiveGoal();
          }
        }
      )
      .subscribe();

    fetchActivePoll();
    fetchActiveGoal();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(moderationChannel);
      supabase.removeChannel(roomChannel);
      supabase.removeChannel(pollChannel);
    };
  }, [room.id, activePoll?.id]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('room_messages')
        .select(`
          *,
          sender:sender_id (username, avatar)
        `)
        .eq('room_id', room.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (data && !error) {
        const formattedMessages: ChatMessage[] = data.map((msg: any) => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderName: msg.sender?.username || 'User',
          senderAvatar: msg.sender?.avatar || DEFAULT_IMAGES.AVATAR,
          text: msg.content,
          type: 'text',
          timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: true
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('[Room] Fetch messages error:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select(`
          *,
          user:user_id (id, username, avatar, role, last_seen_at)
        `)
        .eq('room_id', room.id);

      if (data && !error) {
        // Approved members
        setMembers(data
          .filter((m: any) => m.status === 'approved' && !m.is_banned)
          .map((m: any) => ({
            id: m.user?.id,
            username: m.user?.username || 'User',
            avatar: m.user?.avatar || DEFAULT_IMAGES.AVATAR,
            role: m.user?.role,
            lastSeenAt: m.user?.last_seen_at,
            isOnline: m.user?.last_seen_at ?
              (new Date().getTime() - new Date(m.user.last_seen_at).getTime()) < 600000 : false,
            isMuted: m.is_muted || false
          })));

        // Banned members (for host to see and unban)
        setBannedMembers(data
          .filter((m: any) => m.is_banned)
          .map((m: any) => ({
            id: m.user?.id,
            username: m.user?.username || 'User',
            avatar: m.user?.avatar || DEFAULT_IMAGES.AVATAR
          })));
      }
    } catch (error) {
      console.error('[Room] Fetch members error:', error);
    }
  };

  const fetchAvailableModels = async () => {
    setLoadingAvailable(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'model')
        .eq('is_available', true);

      if (data && !error) {
        setAvailableModelsStore(data.map(p => ({
          id: p.id,
          username: p.username || 'User',
          avatar: p.avatar || DEFAULT_IMAGES.AVATAR,
          role: p.role,
          followers: p.followers || 0,
          bio: p.bio,
          location: p.location,
          rate_event_live: p.rate_event_live || 0,
          rate_onsite: p.rate_onsite || 0,
          rate_product_presentation: p.rate_product_presentation || 0,
          gallery: p.gallery || [],
          isOnline: p.last_seen_at ?
            (new Date().getTime() - new Date(p.last_seen_at).getTime()) < 600000 : false
        })));
      }
    } catch (err) {
      console.error('[Room] Fetch available models error:', err);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const fetchActivePoll = async () => {
    try {
      const { data: poll, error } = await supabase
        .from('room_polls')
        .select('*')
        .eq('room_id', room.id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (poll) {
        setActivePoll(poll);

        // Fetch model details
        const { data: models } = await supabase
          .from('profiles')
          .select('id, username, avatar')
          .in('id', poll.model_ids);

        setPollModels(models || []);

        // Fetch votes count
        const { data: votes } = await supabase
          .from('room_poll_votes')
          .select('model_id')
          .eq('poll_id', poll.id);

        const counts: Record<string, number> = {};
        votes?.forEach(v => {
          counts[v.model_id] = (counts[v.model_id] || 0) + 1;
        });
        setPollVotes(counts);

        // Check if I voted
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: myVote } = await supabase
            .from('room_poll_votes')
            .select('model_id')
            .eq('poll_id', poll.id)
            .eq('user_id', user.id)
            .maybeSingle();
          if (myVote) setUserVote(myVote.model_id);
        }

        // Start timer
        const expiry = new Date(poll.expires_at).getTime();
        const updateTimer = () => {
          const diff = Math.max(0, Math.floor((expiry - new Date().getTime()) / 1000));
          setTimeLeft(diff);
          if (diff <= 0) setActivePoll(null);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
      } else {
        setActivePoll(null);
      }
    } catch (err) {
      console.error('Error fetching poll:', err);
    }
  };

  const fetchActiveGoal = async () => {
    try {
      const { data: goal } = await supabase
        .from('room_donation_goals')
        .select('*')
        .eq('room_id', room.id)
        .eq('status', 'active')
        .maybeSingle();

      if (goal) {
        setActiveGoal(goal);

        // Fetch model details
        const { data: model } = await supabase.from('profiles').select('*').eq('id', goal.model_id).single();
        if (model) setGoalModel(model);

        // Timer logic (10 mins from created_at)
        const created = new Date(goal.created_at).getTime();
        const expiry = created + (10 * 60 * 1000);

        const updateGoalTimer = () => {
          const now = new Date().getTime();
          const diff = Math.max(0, Math.floor((expiry - now) / 1000));
          setGoalTimeLeft(diff);
          if (diff <= 0) {
            // Optionally auto-expire locally or wait for backend
            // setActiveGoal(null); 
          }
        };
        updateGoalTimer();
        const interval = setInterval(updateGoalTimer, 1000);
        return () => clearInterval(interval);

      } else {
        setActiveGoal(null);
        setGoalModel(null);
      }
    } catch (err) {
      console.error('Error fetching goal:', err);
    }
  };

  const handleStartPoll = async () => {
    if (selectedModelsForPoll.length !== 3) {
      showAlert({ message: 'Select exactly 3 models to start voting', type: 'warning' });
      return;
    }

    try {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('room_polls')
        .insert({
          room_id: room.id,
          host_id: room.hostId,
          model_ids: selectedModelsForPoll,
          expires_at: expiresAt
        })
        .select()
        .single();

      if (error) throw error;

      setShowAvailableModels(false);
      setSelectedModelsForPoll([]);
      showAlert({ message: 'Voting started!', type: 'success' });
      fetchActivePoll();
    } catch (err) {
      console.error('Error starting poll:', err);
      showAlert({ message: 'Failed to start voting', type: 'error' });
    }
  };

  const handleVote = async (modelId: string) => {
    if (userVote) {
      showAlert({ message: 'You have already voted!', type: 'info' });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('room_poll_votes')
        .insert({
          poll_id: activePoll.id,
          user_id: user.id,
          model_id: modelId
        });

      if (error) throw error;
      setUserVote(modelId);
      showAlert({ message: 'Vote recorded!', type: 'success' });
    } catch (err) {
      console.error('Error voting:', err);
      showAlert({ message: 'Failed to record vote', type: 'error' });
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showAlert({ message: 'Please login to send messages', type: 'warning' });
        return;
      }

      // Insert message
      const { error } = await supabase
        .from('room_messages')
        .insert({
          room_id: room.id,
          sender_id: user.id,
          content: inputText.trim()
        });

      if (error) throw error;

      // Update room's last message
      await supabase
        .from('chat_rooms')
        .update({
          last_message: inputText.trim().substring(0, 50),
          last_message_time: new Date().toISOString()
        })
        .eq('id', room.id);

      setInputText('');
    } catch (error: any) {
      console.error('[Room] Send error:', error);
      showAlert({ message: 'Failed to send message', type: 'error' });
    }
  };

  const handleSendGift = async (gift: typeof GIFTS[0]) => {
    if (walletBalance >= gift.price) {
      try {
        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          showAlert({ message: 'Please login to send gifts', type: 'warning' });
          return;
        }

        // 2. Deduct coins from sender (calls RPC internally)
        await onUseCoins(gift.price);

        // 3. Add coins to Host
        const { error: addError } = await supabase.rpc('add_coins', {
          user_id: room.hostId,
          amount: gift.price
        });
        if (addError) throw addError;

        // 4. Record in received_gifts table
        const { error: giftError } = await supabase
          .from('received_gifts')
          .insert({
            sender_id: user.id,
            receiver_id: room.hostId,
            gift_id: gift.id.toString(),
            gift_name: gift.name,
            gift_icon: gift.icon,
            price: gift.price
          });
        if (giftError) throw giftError;

        // 5. Post message to room_messages
        const { error: msgError } = await supabase
          .from('room_messages')
          .insert({
            room_id: room.id,
            sender_id: user.id,
            content: `🎁 ส่งของขวัญ ${gift.name} ${gift.icon} ให้ผู้จัด`
          });
        if (msgError) throw msgError;

        // 6. Trigger UI Feedback
        setShowGifts(false);
        const id = Date.now();
        setGiftAnimation({ id, icon: gift.icon, name: gift.name, sender: currentUser || 'Me' });
        setTimeout(() => setGiftAnimation(null), 3000);

      } catch (error: any) {
        console.error('[Room] Gift error:', error);
        showAlert({ message: 'Failed to send gift. Please try again.', type: 'error' });
      }
    } else {
      showAlert({ message: 'Insufficient coins!', type: 'error' });
      onOpenWallet();
    }
  };

  // Host can mute/unmute members
  const handleToggleMute = async (memberId: string, currentlyMuted: boolean) => {
    if (!isHost) return;

    try {
      const { error } = await supabase
        .from('room_members')
        .update({ is_muted: !currentlyMuted })
        .eq('room_id', room.id)
        .eq('user_id', memberId);

      if (error) throw error;

      // Optimistic update
      setMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, isMuted: !currentlyMuted } : m
      ));

      showAlert({ message: `Member ${currentlyMuted ? 'unmuted' : 'muted'}`, type: 'success' });
    } catch (err) {
      console.error('Error toggling mute:', err);
    }
  };

  const handleDonateToGoal = async () => {
    // Mock Donation Logic for now
    if (!activeGoal) return;
    // Ideally show a modal to input amount, for now just link to wallet or generic alert
    showAlert({ message: 'Select "Gift" to donate coins effectively for now!', type: 'info' });
    onOpenWallet();
  };


  // Host can ban/unban members
  const handleToggleBan = async (memberId: string, currentlyBanned: boolean) => {
    if (!isHost) return;

    try {
      const { error } = await supabase
        .from('room_members')
        .update({ is_banned: !currentlyBanned })
        .eq('room_id', room.id)
        .eq('user_id', memberId);

      if (error) throw error;

      // Refresh members list to update both approved and banned lists
      await fetchMembers();

      showAlert({
        message: !currentlyBanned ? 'Member has been banned' : 'Member has been unbanned',
        type: !currentlyBanned ? 'error' : 'success'
      });
    } catch (error) {
      console.error('[Room] Ban error:', error);
      showAlert({ message: 'Failed to update ban status', type: 'error' });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black animate-slide-in relative overflow-hidden">
      {/* Animation Overlay */}
      {isBanned && (
        <div className="absolute inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-8 text-center animate-fade-in backdrop-blur-xl">
          <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
            <Ban size={48} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Access Denied</h2>
          <p className="text-gray-400 text-sm max-w-xs leading-relaxed mb-8">You have been banned from this room by the host and can no longer view or participate in the conversation.</p>
          <button
            onClick={onBack}
            className="px-8 py-3 bg-white text-black font-black rounded-full uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-transform"
          >
            Leave Room
          </button>
        </div>
      )}

      {/* Styles for animation */}
      <style>{`
        @keyframes giftEntrance {
            0% { transform: scale(0) rotate(-45deg); opacity: 0; }
            50% { transform: scale(1.5) rotate(10deg); opacity: 1; }
            70% { transform: scale(1.2) rotate(-5deg); opacity: 1; }
            100% { transform: scale(3) rotate(0deg); opacity: 0; }
        }
        .animate-gift-entrance {
            animation: giftEntrance 3s ease-in-out forwards;
        }
        @keyframes spinSlow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spinSlow 10s linear infinite;
        }
        @keyframes textSlideUp {
            0% { transform: translateY(20px); opacity: 0; }
            20% { transform: translateY(0); opacity: 1; }
            80% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(-20px); opacity: 0; }
        }
        .animate-text-slide-up {
            animation: textSlideUp 3s ease-in-out forwards;
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900/90 backdrop-blur border-b border-gray-800 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={22} />
          </button>

          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gray-700 overflow-hidden border border-gray-600">
              <img src={room.image || DEFAULT_IMAGES.ROOM} className="w-full h-full object-cover" alt={room.name} />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-0.5 border border-gray-700">
              {room.type === 'private' ? <Lock size={10} className="text-yellow-500" /> : <Globe size={10} className="text-blue-500" />}
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-white font-bold text-base leading-tight truncate max-w-[150px]">{room.name}</span>
            <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
              <Users size={10} /> {room.members.toLocaleString()} {t.members}
            </span>
          </div>
        </div>

        <button className="text-gray-400 hover:text-white transition-colors p-2">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'chat' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'members' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            Members
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-black relative">

        {/* --- Chat View --- */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            {/* Active Poll Banner */}
            {/* Active Donation Goal */}
            {activeGoal && goalModel && (
              <div className="mx-4 mt-4 bg-gradient-to-br from-gray-800 to-black rounded-3xl p-4 border border-amber-500/30 shadow-2xl shadow-amber-900/10 relative overflow-hidden animate-slide-down">
                {/* Decorative Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                <div className="flex items-center gap-4 relative z-10">
                  {/* Model Avatar */}
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 to-yellow-600">
                      <img src={goalModel.avatar} className="w-full h-full rounded-full object-cover border-2 border-black" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full border border-black">
                      LIVE
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-white font-bold text-sm flex items-center gap-2">
                      <span>Support {goalModel.username}</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/30">
                        Goal
                      </span>
                    </h3>

                    <div className="flex items-end justify-between mt-2 mb-1">
                      <div className="text-amber-400 font-black text-lg leading-none">
                        <Coins size={14} className="inline mr-1 mb-0.5" />
                        {activeGoal.current_amount.toLocaleString()}
                      </div>
                      <div className="text-gray-500 font-bold text-xs">
                        / {activeGoal.target_amount.toLocaleString()} Coins
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-yellow-600 shadow-[0_0_10px_rgba(251,191,36,0.5)] transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, (activeGoal.current_amount / activeGoal.target_amount) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Timer & Action */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 relative z-10">
                  <div className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
                    <Clock size={12} className="text-amber-500/80" />
                    <span className={goalTimeLeft < 60 ? 'text-red-500 animate-pulse font-bold' : ''}>
                      {Math.floor(goalTimeLeft / 60)}:{(goalTimeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  <button
                    onClick={handleDonateToGoal}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-4 py-2 rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                  >
                    <Gift size={12} /> DONATE
                  </button>
                </div>
              </div>
            )}

            {activePoll && (
              <div className="bg-gradient-to-r from-red-600/20 to-black border-b border-red-600/30 p-4 animate-slide-down sticky top-0 z-20 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
                    <span className="text-xs font-black text-white uppercase tracking-widest italic">Live Voting</span>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Time Left</span>
                    <span className="text-xs font-mono font-bold text-red-500">
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {pollModels.map(model => {
                    const votes = pollVotes[model.id] || 0;
                    const totalVotes = (Object.values(pollVotes) as number[]).reduce((a: number, b: number) => a + b, 0) || 1;
                    const percentage = Math.round((votes / totalVotes) * 100);
                    const isMyVote = userVote === model.id;

                    return (
                      <button
                        key={model.id}
                        onClick={() => handleVote(model.id)}
                        disabled={!!userVote}
                        className={`group relative flex flex-col items-center transition-all ${userVote && !isMyVote ? 'opacity-40 grayscale' : 'opacity-100'
                          }`}
                      >
                        <div className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 mb-2 transition-all ${isMyVote ? 'border-red-600 scale-110 shadow-lg shadow-red-900/40' : 'border-white/10 group-hover:border-white/30'
                          }`}>
                          <img src={model.avatar} className="w-full h-full object-cover" />
                          {isMyVote && (
                            <div className="absolute inset-x-0 bottom-0 bg-red-600 text-[8px] font-black text-white py-0.5 text-center uppercase">VOTED</div>
                          )}
                        </div>

                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-1">
                          <div
                            className="h-full bg-red-600 transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>

                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-white truncate max-w-[60px]">{model.username}</span>
                          <span className="text-[9px] text-red-500 font-bold">{votes} {votes === 1 ? 'Vote' : 'Votes'}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="p-4 space-y-4 pb-20 flex-1 overflow-y-auto no-scrollbar">
              <div className="text-center text-xs text-gray-600 my-4 uppercase tracking-widest font-medium">
                Today
              </div>

              {messages.map((msg) => {
                const isMe = msg.senderId === currentUserIdState || msg.senderId === 'me';
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>

                    {!isMe && (
                      <button
                        onClick={() => onUserClick(msg.senderId)}
                        className="flex flex-col items-center mr-2 mt-auto active:scale-95 transition-transform"
                      >
                        <div className="relative">
                          <div className={`w-8 h-8 rounded-full bg-gray-800 overflow-hidden border border-gray-700 ${members.find(m => m.id === msg.senderId)?.isMuted ? 'opacity-50' : ''}`}>
                            <img src={msg.senderAvatar} className="w-full h-full object-cover" />
                          </div>
                          {/* Muted Overlay */}
                          {members.find(m => m.id === msg.senderId)?.isMuted && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                              <VolumeX size={12} className="text-red-500" />
                            </div>
                          )}
                          {/* Role Badge */}
                          <UserBadge
                            role={members.find(m => m.id === msg.senderId)?.role}
                            size="xs"
                            className="absolute -top-1 -right-1"
                          />
                          {/* Online Status */}
                          {members.find(m => m.id === msg.senderId)?.isOnline && !members.find(m => m.id === msg.senderId)?.isMuted && (
                            <div className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-black rounded-full"></div>
                          )}
                        </div>
                      </button>
                    )}

                    <div className={`max-w-[75%]`}>

                      {!isMe && (
                        <div className="flex items-center gap-1 ml-1 mb-0.5">
                          <span className="text-[10px] text-gray-400">{msg.senderName}</span>
                          {/* Mute indicator */}
                          {members.find(m => m.id === msg.senderId)?.isMuted && (
                            <VolumeX size={10} className="text-red-400" />
                          )}
                          {/* Host Mute Button */}
                          {isHost && msg.senderId !== room.hostId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const member = members.find(m => m.id === msg.senderId);
                                if (member) handleToggleMute(msg.senderId, member.isMuted);
                              }}
                              className={`ml-1 p-0.5 rounded transition-all hover:scale-110 ${members.find(m => m.id === msg.senderId)?.isMuted
                                ? 'text-green-400 hover:bg-green-600/20'
                                : 'text-red-400 hover:bg-red-600/20'
                                }`}
                              title={members.find(m => m.id === msg.senderId)?.isMuted ? 'Unmute' : 'Mute'}
                            >
                              {members.find(m => m.id === msg.senderId)?.isMuted ? <Volume2 size={12} /> : <VolumeX size={12} />}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div className={`rounded-2xl px-4 py-3 shadow-sm relative ${isMe
                        ? 'bg-red-600 text-white rounded-br-sm'
                        : 'bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700'
                        }`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>

                      {/* Timestamp */}
                      <div className={`text-[10px] text-gray-500 flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* --- Members View --- */}
        {activeTab === 'members' && (
          <div className="p-4 space-y-3 pb-20">
            {/* Host */}
            <div className="bg-gray-900/50 border border-yellow-500/30 rounded-xl p-3 flex items-center gap-3">
              <button
                onClick={() => onUserClick(room.hostId)}
                className="relative active:scale-95 transition-transform"
              >
                <img src={room.hostAvatar || DEFAULT_IMAGES.AVATAR} className="w-12 h-12 rounded-full object-cover border-2 border-yellow-500" />
                {/* Online status for host */}
                {members.find(m => m.id === room.hostId)?.isOnline && (
                  <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black p-0.5 rounded-full">
                  <Crown size={10} fill="black" />
                </div>
              </button>
              <div>
                <h4 className="text-yellow-500 font-bold text-sm flex items-center gap-2">
                  {room.hostName}
                  <span className="text-[9px] bg-yellow-500/20 px-1.5 rounded border border-yellow-500/50 uppercase">Host</span>
                </h4>
                <span className="text-xs text-gray-400">Room Owner</span>
              </div>
            </div>

            <div className="h-px bg-gray-800 my-2"></div>
            <h3 className="text-xs text-gray-500 uppercase font-bold mb-2">All Members ({members.filter(m => m.id !== room.hostId).length})</h3>

            {members.filter(m => m.id !== room.hostId).map(member => (
              <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-900 transition-colors">
                <button
                  onClick={() => onUserClick(member.id)}
                  className="flex items-center gap-3 text-left w-full group"
                >
                  <div className="relative">
                    <img src={member.avatar} className={`w-10 h-10 rounded-full object-cover bg-gray-800 border border-gray-700 group-hover:border-gray-500 transition-colors ${member.isMuted ? 'opacity-50' : ''}`} />
                    {/* Role Badge */}
                    <UserBadge
                      role={member.role}
                      size="xs"
                      className="absolute -top-1 -right-1"
                    />
                    {/* Muted Overlay */}
                    {member.isMuted && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <VolumeX size={16} className="text-red-500" />
                      </div>
                    )}
                    {/* Online Status */}
                    {member.isOnline && !member.isMuted && <div className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-green-500 border-2 border-black rounded-full"></div>}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-sm flex items-center gap-1 group-hover:text-red-500 transition-colors">
                      {member.username}
                      {member.isMuted && <VolumeX size={12} className="text-red-400" />}
                    </h4>
                    <span className={`text-[10px] capitalize ${member.isMuted ? 'text-red-400' : 'text-gray-500'}`}>
                      {member.isMuted ? 'Muted' : (member.role || 'Member')}
                    </span>
                  </div>
                </button>

                {/* Host Mute/Unmute Button */}
                {isHost && member.id !== room.hostId && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleMute(member.id, member.isMuted)}
                      className={`p-2 rounded-lg transition-all active:scale-95 ${member.isMuted
                        ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                        : 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                        }`}
                      title={member.isMuted ? 'Unmute' : 'Mute'}
                    >
                      {member.isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>
                    <button
                      onClick={() => handleToggleBan(member.id, false)}
                      className="p-2 rounded-lg transition-all active:scale-95 bg-red-600/20 text-red-400 hover:bg-red-600/30"
                      title="Ban from room"
                    >
                      <Ban size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Banned Members Section (Host Only) */}
            {isHost && bannedMembers.length > 0 && (
              <>
                <div className="h-px bg-red-800/50 my-4"></div>
                <h3 className="text-xs text-red-400 uppercase font-bold mb-2 flex items-center gap-1">
                  <Ban size={12} /> Banned ({bannedMembers.length})
                </h3>
                {bannedMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-red-900/10 border border-red-900/30 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={member.avatar} className="w-10 h-10 rounded-full object-cover bg-gray-800 opacity-50 border border-red-700" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                          <Ban size={16} className="text-red-500" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-red-400 font-medium text-sm line-through">{member.username}</h4>
                        <span className="text-[10px] text-red-500">Banned</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleBan(member.id, true)}
                      className="px-3 py-1.5 rounded-lg transition-all active:scale-95 bg-green-600/20 text-green-400 hover:bg-green-600/30 text-xs font-bold"
                      title="Unban member"
                    >
                      Unban
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

      </div>

      {/* Animation Overlay */}
      {giftAnimation && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none overflow-hidden">
          <div className="absolute w-[150%] h-[150%] bg-gradient-to-r from-yellow-500/10 to-red-500/10 animate-spin-slow"
            style={{ maskImage: 'radial-gradient(circle, black 30%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)' }}>
          </div>
          <div className="relative z-10 text-[120px] drop-shadow-[0_0_25px_rgba(255,255,255,0.6)] animate-gift-entrance filter contrast-125">
            {giftAnimation.icon}
          </div>
          <div className="relative z-10 mt-4 text-center animate-text-slide-up">
            <div className="text-yellow-400 font-black font-athletic text-3xl uppercase tracking-widest drop-shadow-md stroke-black">
              {giftAnimation.sender}
            </div>
            <div className="text-white font-bold text-sm bg-black/60 px-4 py-1 rounded-full backdrop-blur-md border border-white/20 mt-2 inline-flex items-center gap-2 shadow-xl">
              Sent <span className="text-yellow-400 font-black uppercase">{giftAnimation.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* Input Area (Only visible in Chat Tab) */}
      {activeTab === 'chat' && (
        <div className="p-3 bg-gray-900/90 backdrop-blur border-t border-gray-800 flex items-end gap-2 sticky bottom-0 z-30 pb-safe">
          <button
            onClick={() => {
              if (isHost) {
                fetchAvailableModels();
                setShowAvailableModels(true);
              } else {
                setShowGifts(true);
              }
            }}
            className="p-2.5 text-yellow-500 hover:text-yellow-400 bg-gray-800 border border-yellow-500/30 rounded-full transition-colors flex-shrink-0"
          >
            {isHost ? <Plus size={22} /> : <Gift size={22} />}
          </button>

          <form
            onSubmit={handleSend}
            className={`flex-1 bg-gray-800 rounded-2xl flex items-center border border-gray-700 focus-within:border-gray-500 transition-colors ${isMuted ? 'opacity-50 grayscale' : ''}`}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isMuted ? 'You are muted' : t.typeMessage}
              disabled={isMuted}
              className="flex-1 bg-transparent text-white px-4 py-3 focus:outline-none placeholder-gray-500 text-sm max-h-32 disabled:cursor-not-allowed"
            />
            <button type="button" className="p-2 text-gray-400 hover:text-white mr-1" disabled={isMuted}>
              <Smile size={20} />
            </button>
          </form>

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isMuted}
            className={`p-3 rounded-full flex-shrink-0 transition-all ${inputText.trim() && !isMuted
              ? 'bg-red-600 text-white shadow-lg shadow-red-900/50 hover:bg-red-500 transform active:scale-95'
              : 'bg-gray-800 text-gray-600'
              }`}
          >
            <Send size={20} className={inputText.trim() && !isMuted ? "translate-x-0.5" : ""} />
          </button>
        </div>
      )}

      {/* Available Models Modal for Organizer */}
      {showAvailableModels && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md animate-fade-in flex flex-col pt-10">
          <div className="flex-1 bg-gray-900/95 rounded-t-[40px] border-t border-white/10 flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                {viewingProfile && (
                  <button
                    onClick={() => {
                      if (isViewingGallery) {
                        setIsViewingGallery(false);
                      } else {
                        setViewingProfile(null);
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <div>
                  <h3 className="text-white font-black text-xl tracking-tight uppercase italic">
                    {viewingProfile ? viewingProfile.username : (language === 'th' ? 'นายแบบที่ว่าง' : 'Available Models')}
                  </h3>
                  {!viewingProfile && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">{availableModelsStore.length} Ready for work</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAvailableModels(false);
                  setViewingProfile(null);
                  setIsViewingGallery(false);
                }}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-5">
              {loadingAvailable ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-widest animate-pulse">Scanning models...</span>
                </div>
              ) : viewingProfile ? (
                isViewingGallery ? (
                  // Gallery View
                  <div className="animate-slide-up h-full">
                    {viewingProfile.gallery && viewingProfile.gallery.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 pb-20">
                        {viewingProfile.gallery.map((img: string, idx: number) => (
                          <div key={idx} className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 bg-gray-800 animate-scale-in" style={{ animationDelay: `${idx * 50}ms` }}>
                            <img src={img} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-32 text-gray-600">
                        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-4 text-4xl">
                          🖼️
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest">No Photos Available</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Profile View within Modal */
                  <div className="animate-slide-up space-y-6">
                    {/* Top Header Card */}
                    <div className="relative aspect-[4/3] rounded-3xl overflow-hidden group shadow-2xl border border-white/10">
                      <img src={viewingProfile.avatar} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>

                      {/* Floating Badges */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        {viewingProfile.isOnline && (
                          <div className="bg-green-500 text-[10px] font-black px-3 py-1 rounded-full text-black shadow-lg animate-pulse">ONLINE</div>
                        )}
                        <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white border border-white/20">MODEL</div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center justify-center">
                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-1 text-center">Followers</p>
                        <p className="text-sm font-black text-white text-center">{viewingProfile.followers.toLocaleString()}</p>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center justify-center">
                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-1 text-center">Location</p>
                        <p className="text-xs font-black text-white text-center truncate w-full">{viewingProfile.location || 'Bangkok'}</p>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                      <h4 className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-3 italic">About Model</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{viewingProfile.bio || 'This model has not provided a biography yet.'}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-white/5 rounded-2xl p-2 border border-white/5 flex flex-col items-center justify-center">
                        <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest mb-1 text-center">Live Rate</p>
                        <p className="text-xs font-black text-yellow-500 text-center truncate w-full">
                          {viewingProfile.rate_event_live ? `฿${viewingProfile.rate_event_live.toLocaleString()}` : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-2 border border-white/5 flex flex-col items-center justify-center">
                        <p className="text-[7px] text-pink-400 font-bold uppercase tracking-widest mb-1 text-center">On-Site</p>
                        <p className="text-xs font-black text-pink-500 text-center truncate w-full">
                          {viewingProfile.rate_onsite ? `฿${viewingProfile.rate_onsite.toLocaleString()}` : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-2 border border-white/5 flex flex-col items-center justify-center">
                        <p className="text-[7px] text-blue-400 font-bold uppercase tracking-widest mb-1 text-center">Product</p>
                        <p className="text-xs font-black text-blue-500 text-center truncate w-full">
                          {viewingProfile.rate_product_presentation ? `฿${viewingProfile.rate_product_presentation.toLocaleString()}` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <button
                        onClick={() => setIsViewingGallery(true)}
                        className="bg-gray-800 text-white font-bold py-3 rounded-xl uppercase text-[10px] tracking-widest border border-gray-700 hover:bg-gray-700 active:scale-95 transition-all"
                      >
                        View Gallery
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            // 1. Create Invite Record
                            const { data: inviteData, error: inviteError } = await supabase
                              .from('room_invites')
                              .insert({
                                room_id: room.id,
                                model_id: viewingProfile.id,
                                status: 'pending'
                              })
                              .select()
                              .single();

                            if (inviteError) throw inviteError;

                            // 2. Create Notification
                            const { error: notifError } = await supabase
                              .from('notifications')
                              .insert({
                                user_id: viewingProfile.id,
                                actor_id: room.hostId, // Current user is host
                                type: 'room_invite',
                                content: `Invited you to co-host in room ${room.name}`,
                                metadata: {
                                  room_id: room.id,
                                  invite_id: inviteData.id
                                },
                                is_read: false
                              });

                            if (notifError) throw notifError;

                            showAlert({ message: `Invite sent to ${viewingProfile.username}`, type: 'success' });
                          } catch (err) {
                            console.error('Invite Error:', err);
                            showAlert({ message: 'Failed to send invite', type: 'error' });
                          }
                        }}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-widest shadow-lg shadow-green-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={14} className="stroke-[3px]" /> Invite to Live
                      </button>
                    </div>
                  </div>
                )
              ) : (
                /* Grid View */
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-3">
                    {availableModelsStore.length > 0 ? availableModelsStore.map((model, idx) => {
                      const isSelected = selectedModelsForPoll.includes(model.id);
                      return (
                        <div
                          key={model.id}
                          className="flex flex-col animate-scale-in group relative"
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          {/* Profile Click Area */}
                          <button
                            onClick={() => setViewingProfile(model)}
                            className="absolute top-0 right-0 z-10 p-1 bg-black/40 rounded-full text-white/60 hover:text-white"
                          >
                            <MoreVertical size={14} />
                          </button>

                          <button
                            onClick={() => {
                              if (isSelected) {
                                setSelectedModelsForPoll(prev => prev.filter(id => id !== model.id));
                              } else if (selectedModelsForPoll.length < 3) {
                                setSelectedModelsForPoll(prev => [...prev, model.id]);
                              } else {
                                showAlert({ message: 'Select up to 3 models only', type: 'warning' });
                              }
                            }}
                            className="flex flex-col w-full"
                          >
                            <div className="relative aspect-square mb-2 group">
                              {/* Selection Ring */}
                              {isSelected && (
                                <div className="absolute -inset-1 rounded-2xl bg-red-600 animate-pulse z-[1]"></div>
                              )}

                              {/* Selection Checkmark */}
                              {isSelected && (
                                <div className="absolute top-1 left-1 z-[2] bg-red-600 rounded-full p-1 shadow-lg">
                                  <Check size={12} className="text-white" strokeWidth={4} />
                                </div>
                              )}

                              <div className={`relative w-full h-full rounded-2xl overflow-hidden border transition-all duration-300 z-[1] ${isSelected ? 'border-red-600 scale-[0.9]' : 'border-white/10 group-hover:border-red-500/50'
                                }`}>
                                <img src={model.avatar} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                {/* Bottom Indicator */}
                                {model.isOnline && (
                                  <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full border border-black shadow-lg shadow-green-500/50"></div>
                                )}
                              </div>
                            </div>
                            <div className="px-1 text-center">
                              <span className={`text-[10px] font-black truncate block uppercase tracking-tighter transition-colors ${isSelected ? 'text-red-500' : 'text-white'
                                }`}>
                                {model.username}
                              </span>
                              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest truncate block opacity-60">
                                {model.followers} Foll.
                              </span>
                              {model.rate_event_live && (
                                <span className="text-[8px] text-yellow-500 font-black uppercase tracking-widest truncate block mt-0.5">
                                  ฿{model.rate_event_live.toLocaleString()}/hr
                                </span>
                              )}
                            </div>
                          </button>
                        </div>
                      );
                    }) : (
                      <div className="col-span-3 flex flex-col items-center justify-center py-20 bg-white/5 rounded-[40px] border border-white/5 w-full">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                          <Users size={32} className="text-gray-600" />
                        </div>
                        <p className="text-gray-500 font-black text-xs uppercase tracking-widest">No models available</p>
                      </div>
                    )}
                  </div>

                  {/* Voting Footer */}
                  {selectedModelsForPoll.length > 0 && (
                    <div className="animate-slide-up bg-white/5 rounded-3xl p-5 border border-white/10 mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex -space-x-2">
                          {selectedModelsForPoll.map(id => {
                            const model = availableModelsStore.find(m => m.id === id);
                            return (
                              <div key={id} className="w-10 h-10 rounded-full border-2 border-red-600 overflow-hidden bg-gray-800">
                                <img src={model?.avatar} className="w-full h-full object-cover" />
                              </div>
                            );
                          })}
                          {[...Array(3 - selectedModelsForPoll.length)].map((_, i) => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 text-xs">
                              ?
                            </div>
                          ))}
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Selected</p>
                          <p className="text-lg font-black text-white">{selectedModelsForPoll.length}/3</p>
                        </div>
                      </div>

                      <button
                        onClick={handleStartPoll}
                        disabled={selectedModelsForPoll.length !== 3}
                        className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl ${selectedModelsForPoll.length === 3
                          ? 'bg-red-600 text-white shadow-red-900/40 active:scale-95'
                          : 'bg-white/5 text-white/20 cursor-not-allowed'
                          }`}
                      >
                        Start Voting (15 Mins)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gift Modal */}
      {showGifts && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-t-3xl border-t border-gray-700 flex flex-col shadow-2xl pb-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Gift size={18} className="text-yellow-400" /> Send to Host
                </h3>
                <div className="bg-black/40 px-3 py-1 rounded-full border border-yellow-500/30 flex items-center gap-1.5">
                  <Coins size={12} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-400 text-xs font-bold">{walletBalance}</span>
                </div>
              </div>
              <button onClick={() => setShowGifts(false)} className="text-gray-400 p-2">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 p-4">
              {GIFTS.map(gift => (
                <button
                  key={gift.id}
                  onClick={() => handleSendGift(gift)}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all active:scale-95 group ${walletBalance >= gift.price
                    ? 'bg-gray-800 border-gray-700 hover:border-yellow-500 hover:bg-gray-750'
                    : 'bg-gray-800/50 border-gray-800 opacity-60 cursor-not-allowed'
                    }`}
                >
                  <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">{gift.icon}</div>
                  <span className="text-[10px] font-bold text-white mb-1">{gift.name}</span>
                  <span className="text-[9px] text-yellow-400 font-medium bg-black/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Coins size={8} className="fill-yellow-400" /> {gift.price}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GroupChatRoom;
