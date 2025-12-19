
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, CheckCheck, BadgeCheck, Users, Lock, Globe, Plus } from 'lucide-react';
import { Language, MessagePreview, ChatRoom, UserProfile } from '../types';
import { TRANSLATIONS, DEFAULT_IMAGES } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface MessagesProps {
  language: Language;
  onBack: () => void;
  onOpenChat: (user: MessagePreview) => void;
  onOpenGroup: (room: ChatRoom) => void;
  chatRooms: ChatRoom[];
  userProfile: UserProfile;
  onCreateRoom: () => void;
  currentUserId?: string;
}

const Messages: React.FC<MessagesProps> = ({
  language,
  onBack,
  onOpenChat,
  onOpenGroup,
  chatRooms,
  userProfile,
  onCreateRoom,
  currentUserId
}) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');
  const [searchTerm, setSearchTerm] = useState('');
  const [conversations, setConversations] = useState<MessagePreview[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'chats' && currentUserId) {
      fetchConversations();

      // Realtime listener to refresh list on new messages
      const channel = supabase
        .channel('conversations_refresh')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
          fetchConversations();
        })
        .subscribe();

      // UI refresh interval for online status
      const refreshId = setInterval(() => {
        setConversations(prev => prev.map(c => {
          const lastSeen = c.lastSeenAt ? new Date(c.lastSeenAt).getTime() : 0;
          const online = (new Date().getTime() - lastSeen) < (10 * 60 * 1000); // 10 minutes
          return { ...c, isOnline: online };
        }));
      }, 30000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(refreshId);
      };
    }
  }, [activeTab, currentUserId]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_conversations');
      if (data) {
        const now = new Date().getTime();
        setConversations(data.map((c: any) => {
          const lastSeen = c.last_seen_at ? new Date(c.last_seen_at).getTime() : 0;
          const online = (now - lastSeen) < (10 * 60 * 1000); // 10 minutes

          return {
            id: c.partner_id,
            userId: c.partner_id,
            username: c.username || 'User',
            avatar: c.avatar || DEFAULT_IMAGES.AVATAR,
            lastMessage: c.last_message,
            time: new Date(c.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread: Number(c.unread_count),
            isOnline: online,
            lastSeenAt: c.last_seen_at
          };
        }));
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = conversations.filter(msg =>
    msg.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-24 animate-fade-in h-screen bg-black flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4 sticky top-0 bg-black/90 backdrop-blur z-30 border-b border-gray-800">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-xl font-athletic tracking-wide text-white">
          {t.messages}
        </h2>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-2">
        <div className="flex bg-gray-900 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'chats' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            {t.chats}
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'groups' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            {t.groups}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3">
        <div className="relative">
          <input
            type="text"
            placeholder={t.searchMessages}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 focus:ring-1 focus:ring-gray-700 transition-all text-sm"
          />
          <Search size={16} className="absolute left-3.5 top-3.5 text-gray-500" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {activeTab === 'chats' ? (
          filteredMessages.length > 0 ? (
            <div className="divide-y divide-gray-800/50 pb-20">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => onOpenChat(msg)}
                  className="flex items-center gap-4 px-4 py-4 hover:bg-gray-900/40 cursor-pointer transition-colors active:bg-gray-900/80 group"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gray-800 overflow-hidden border border-gray-700 group-hover:border-gray-500 transition-colors">
                      <img src={msg.avatar} className="w-full h-full object-cover" />
                    </div>
                    {msg.isOnline && (
                      <span className="absolute bottom-0 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full shadow-lg"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-white truncate text-base">{msg.username}</h3>
                      <span className="text-[10px] text-gray-500 font-medium">{msg.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`truncate text-sm pr-4 ${msg.unread > 0 ? 'text-white font-bold' : 'text-gray-500'}`}>
                        {msg.lastMessage}
                      </p>
                      {msg.unread > 0 && (
                        <div className="bg-red-600 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center shadow-lg shadow-red-900/40">
                          {msg.unread}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-4">
                <Search size={24} className="opacity-50" />
              </div>
              <p>{loading ? 'Loading chats...' : t.noMessages}</p>
            </div>
          )
        ) : (
          // --- Group Chats ---
          filteredGroups.length > 0 ? (
            <div className="divide-y divide-gray-800/50 pb-20">
              {filteredGroups.map((room) => (
                <div
                  key={room.id}
                  onClick={() => onOpenGroup(room)}
                  className="flex items-center gap-4 px-4 py-4 hover:bg-gray-900/40 cursor-pointer transition-colors active:bg-gray-900/80 group"
                >
                  {/* Group Avatar */}
                  <div className="relative">
                    <div className="w-14 h-14 rounded-xl bg-gray-800 overflow-hidden border border-gray-700 group-hover:border-gray-500 transition-colors">
                      <img src={room.image} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-0.5 border border-gray-700">
                      {room.type === 'private' ? <Lock size={12} className="text-yellow-500" /> : <Globe size={12} className="text-blue-500" />}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-white truncate text-base">{room.name}</h3>
                      <span className="text-[10px] text-gray-500">{room.lastMessageTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="truncate text-sm text-gray-500 pr-4">
                        <span className="text-gray-400 font-medium mr-1">{room.lastMessage?.split(':')[0]}:</span>
                        {room.lastMessage}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-gray-600 bg-gray-900 px-1.5 py-0.5 rounded">
                        <Users size={10} /> {room.members}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-4">
                <Users size={24} className="opacity-50" />
              </div>
              <p>No active groups</p>
            </div>
          )
        )}

        {/* Create Room Button (Organizer Only) */}
        {activeTab === 'groups' && userProfile.role === 'organizer' && (
          <button
            onClick={onCreateRoom}
            className="fixed bottom-24 right-4 w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-900/50 hover:bg-red-500 hover:scale-105 active:scale-95 transition-all z-40 border-2 border-black"
          >
            <Plus size={28} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Messages;
