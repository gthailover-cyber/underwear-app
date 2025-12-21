
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Send, Plus, Smile, Users, Lock, Globe, Gift, Coins, X, Check, Crown, BicepsFlexed } from 'lucide-react';
import { ChatRoom, ChatMessage, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { useAlert } from '../context/AlertContext';

interface GroupChatRoomProps {
  room: ChatRoom;
  language: Language;
  onBack: () => void;
  currentUser: string;
  currentUserId?: string;
  walletBalance: number;
  onUseCoins: (amount: number) => void;
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
  const [showGifts, setShowGifts] = useState(false);
  const [giftAnimation, setGiftAnimation] = useState<{ id: number; icon: string; name: string; sender: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [currentUserIdState, setCurrentUserIdState] = useState<string | null>(null);
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

        if (!existingMember && room.type === 'public') {
          // Auto-join public room
          const { error } = await supabase
            .from('room_members')
            .insert({
              room_id: room.id,
              user_id: user.id
            });

          if (!error) {
            setIsMember(true);
            console.log('[Room] Auto-joined public room');
          }
        } else if (existingMember) {
          setIsMember(true);
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
              senderAvatar: data.sender?.avatar || 'https://picsum.photos/200',
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

    // Realtime listener for room members (for member count)
    const membersChannel = supabase
      .channel(`room_members:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${room.id}`
        },
        (payload) => {
          console.log('[Room] Members changed:', payload);
          // Refresh members list
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

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [room.id]);

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
          senderAvatar: msg.sender?.avatar || 'https://picsum.photos/200',
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
        setMembers(data.map((m: any) => ({
          id: m.user?.id,
          username: m.user?.username || 'User',
          avatar: m.user?.avatar || 'https://picsum.photos/200',
          role: m.user?.role,
          isOnline: m.user?.last_seen_at ?
            (new Date().getTime() - new Date(m.user.last_seen_at).getTime()) < 600000 : false
        })));
      }
    } catch (error) {
      console.error('[Room] Fetch members error:', error);
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

  const handleSendGift = (gift: typeof GIFTS[0]) => {
    if (walletBalance >= gift.price) {
      onUseCoins(gift.price);

      const giftMsg: ChatMessage = {
        id: Date.now().toString(),
        senderId: currentUserIdState || 'me',
        text: `Sent a ${gift.name} ${gift.icon} to Host`,
        type: 'text',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false
      };

      setMessages(prev => [...prev, giftMsg]);
      setShowGifts(false);

      // Trigger Animation
      const id = Date.now();
      setGiftAnimation({ id, icon: gift.icon, name: gift.name, sender: 'Me' });
      setTimeout(() => setGiftAnimation(null), 3000);
    } else {
      showAlert({ message: 'Insufficient coins!', type: 'error' });
      onOpenWallet();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black animate-slide-in relative overflow-hidden">
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
              <img src={room.image} className="w-full h-full object-cover" alt={room.name} />
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
          <div className="p-4 space-y-4 pb-20">
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
                      <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden mb-1 border border-gray-700">
                        <img src={msg.senderAvatar} className="w-full h-full object-cover" />
                      </div>
                    </button>
                  )}

                  <div className={`max-w-[75%]`}>

                    {!isMe && (
                      <span className="text-[10px] text-gray-400 ml-1 mb-0.5 block">{msg.senderName}</span>
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
                <img src={`https://picsum.photos/seed/${room.hostName}/200`} className="w-12 h-12 rounded-full object-cover border-2 border-yellow-500" />
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
            <h3 className="text-xs text-gray-500 uppercase font-bold mb-2">All Members</h3>

            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-900 transition-colors">
                <button
                  onClick={() => onUserClick(member.id)}
                  className="flex items-center gap-3 text-left w-full group"
                >
                  <div className="relative">
                    <img src={member.avatar} className="w-10 h-10 rounded-full object-cover bg-gray-800 border border-gray-700 group-hover:border-gray-500 transition-colors" />
                    {member.isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-black rounded-full"></div>}
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm flex items-center gap-1 group-hover:text-red-500 transition-colors">
                      {member.username}
                      {member.role === 'model' && <BicepsFlexed size={12} className="text-blue-400" />}
                    </h4>
                    <span className="text-[10px] text-gray-500 capitalize">{member.role || 'Member'}</span>
                  </div>
                </button>
              </div>
            ))}
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
            onClick={() => setShowGifts(true)}
            className="p-2.5 text-yellow-500 hover:text-yellow-400 bg-gray-800 border border-yellow-500/30 rounded-full transition-colors flex-shrink-0"
          >
            <Gift size={22} />
          </button>

          <form onSubmit={handleSend} className="flex-1 bg-gray-800 rounded-2xl flex items-center border border-gray-700 focus-within:border-gray-500 transition-colors">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.typeMessage}
              className="flex-1 bg-transparent text-white px-4 py-3 focus:outline-none placeholder-gray-500 text-sm max-h-32"
            />
            <button type="button" className="p-2 text-gray-400 hover:text-white mr-1">
              <Smile size={20} />
            </button>
          </form>

          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`p-3 rounded-full flex-shrink-0 transition-all ${inputText.trim()
              ? 'bg-red-600 text-white shadow-lg shadow-red-900/50 hover:bg-red-500 transform active:scale-95'
              : 'bg-gray-800 text-gray-600'
              }`}
          >
            <Send size={20} className={inputText.trim() ? "translate-x-0.5" : ""} />
          </button>
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
