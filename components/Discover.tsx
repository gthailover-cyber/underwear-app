
import React, { useState, useEffect, useRef } from 'react';
import { Play, TrendingUp, ChevronLeft, ChevronRight, Users, Lock, Globe } from 'lucide-react';
import { Streamer, Language, UserProfile, ChatRoom } from '../types';
import { TRANSLATIONS } from '../constants';
import StreamCard from './StreamCard';
import Stories from './Stories';
import { supabase } from '../lib/supabaseClient';
import { DEFAULT_IMAGES } from '../constants';

interface DiscoverProps {
  language: Language;
  onOpenStream: (streamer: Streamer) => void;
  streamers: Streamer[];
  userProfile: UserProfile;
  onOpenRoom?: (room: ChatRoom) => void;
}

const Discover: React.FC<DiscoverProps> = ({ language, onOpenStream, streamers, userProfile, onOpenRoom }) => {
  const t = TRANSLATIONS[language];
  const [trendingRooms, setTrendingRooms] = useState<ChatRoom[]>([]);
  const roomSliderRef = useRef<HTMLDivElement>(null);

  // Fetch trending rooms (sorted by member count)
  useEffect(() => {
    const fetchTrendingRooms = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_rooms')
          .select(`
            *,
            host:host_id (username, avatar)
          `)
          .order('members', { ascending: false })
          .limit(10);

        console.log('[Discover] Trending rooms:', data, error);

        if (data && !error) {
          setTrendingRooms(data.map((room: any) => ({
            id: room.id,
            name: room.name,
            hostId: room.host_id,
            hostName: room.host?.username || room.host_name || 'Host',
            hostAvatar: room.host?.avatar || DEFAULT_IMAGES.AVATAR,
            coverImage: room.image || DEFAULT_IMAGES.ROOM,
            members: room.members || 0,
            maxMembers: room.max_members || 50,
            type: room.type || 'public',
            isLive: true,
            description: room.description || '',
            tags: room.tags || []
          })));
        }
      } catch (error) {
        console.error('[Discover] Error fetching rooms:', error);
      }
    };

    fetchTrendingRooms();
  }, []);

  // Slider scroll functions
  const scrollLeft = () => {
    if (roomSliderRef.current) {
      roomSliderRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (roomSliderRef.current) {
      roomSliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="pb-24 animate-fade-in">

      {/* Stories Section */}
      <Stories userProfile={userProfile} language={language} />

      {/* Hot Live Section (Horizontal Scroll) */}
      <div className="mb-8">
        <div className="px-4 mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Play size={18} className="text-red-500 fill-red-500" />
            {t.hotLive}
          </h3>
          <button className="text-xs text-gray-500 hover:text-white transition-colors">{t.viewAll}</button>
        </div>

        {streamers.length > 0 ? (
          <div className="overflow-x-auto no-scrollbar flex gap-4 px-4">
            {streamers.slice(0, 5).map((streamer) => (
              <div
                key={streamer.id}
                onClick={() => onOpenStream(streamer)}
                className="flex-shrink-0 w-32 relative group cursor-pointer"
              >
                <div className="aspect-[3/4] rounded-xl overflow-hidden mb-2 relative border border-gray-800">
                  <img src={streamer.coverImage} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">LIVE</div>
                </div>
                <h4 className="text-sm font-bold text-white truncate">{streamer.name}</h4>
                <p className="text-xs text-gray-500 truncate">{streamer.viewerCount.toLocaleString()} {t.watching}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 text-gray-500 text-sm">No live streams at the moment.</div>
        )}
      </div>

      {/* Trending Rooms Section with Slider */}
      <div className="mb-8 relative">
        <div className="px-4 mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-yellow-400" />
            {language === 'th' ? 'ห้องที่มาแรง' : 'Trending Rooms'}
          </h3>
          {/* Desktop Navigation Arrows */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={scrollLeft}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-all active:scale-95"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={scrollRight}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-all active:scale-95"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {trendingRooms.length > 0 ? (
          <div
            ref={roomSliderRef}
            className="overflow-x-auto no-scrollbar flex gap-4 px-4 scroll-smooth"
          >
            {trendingRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => onOpenRoom?.(room)}
                className="flex-shrink-0 w-64 md:w-72 rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-gray-600 cursor-pointer transition-all hover:scale-[1.02] group"
              >
                {/* Cover Image */}
                <div className="relative h-32 md:h-36">
                  <img
                    src={room.coverImage}
                    className="w-full h-full object-cover"
                    alt={room.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                  {/* Room Type Badge */}
                  <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 ${room.type === 'private'
                    ? 'bg-purple-600/80 text-white backdrop-blur-sm'
                    : 'bg-green-600/80 text-white backdrop-blur-sm'
                    }`}>
                    {room.type === 'private' ? <Lock size={10} /> : <Globe size={10} />}
                    {room.type}
                  </div>



                  {/* Host Avatar */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <img
                      src={room.hostAvatar}
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                      alt={room.hostName}
                    />
                    <span className="text-white text-xs font-bold drop-shadow-lg">{room.hostName}</span>
                  </div>
                </div>

                {/* Room Info */}
                <div className="p-4">
                  <h4 className="text-white font-bold text-sm mb-1 truncate group-hover:text-red-400 transition-colors">
                    {room.name}
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <Users size={12} />
                      <span>{room.members} / {room.maxMembers}</span>
                    </div>
                    {/* Member Count Badge */}
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${room.members >= room.maxMembers * 0.8
                      ? 'bg-red-600/20 text-red-400'
                      : room.members >= room.maxMembers * 0.5
                        ? 'bg-yellow-600/20 text-yellow-400'
                        : 'bg-green-600/20 text-green-400'
                      }`}>
                      {room.members >= room.maxMembers * 0.8 ? '🔥 HOT' : room.members >= room.maxMembers * 0.5 ? '📈 Rising' : '✨ Active'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 text-gray-500 text-sm">
            {language === 'th' ? 'ยังไม่มีห้องที่มาแรง' : 'No trending rooms yet'}
          </div>
        )}
      </div>

      {/* Recommended Lives Grid */}
      <div className="px-4">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          {t.recommended}
        </h3>
        {streamers.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {streamers.map((streamer, i) => (
              <StreamCard
                key={`${streamer.id}-${i}`}
                streamer={streamer}
                onPress={onOpenStream}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            Check back later for more live streams!
          </div>
        )}
      </div>

    </div>
  );
};

export default Discover;
