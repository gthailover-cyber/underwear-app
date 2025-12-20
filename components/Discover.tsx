
import React from 'react';
import { Play, TrendingUp, Plus } from 'lucide-react';
import { Streamer, Language, UserProfile } from '../types';
import { TRANSLATIONS, DISCOVER_TAGS } from '../constants';
import StreamCard from './StreamCard';
import Stories from './Stories';

interface DiscoverProps {
  language: Language;
  onOpenStream: (streamer: Streamer) => void;
  streamers: Streamer[];
  userProfile: UserProfile;
}

const Discover: React.FC<DiscoverProps> = ({ language, onOpenStream, streamers, userProfile }) => {
  const t = TRANSLATIONS[language];

  // Logic to show "Stories" (active streamers)
  const stories = streamers.map(s => ({
    id: s.id,
    username: s.name,
    avatar: s.coverImage, // Use cover image as avatar fallback for story
    image: s.coverImage,
    isLive: true
  }));

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

      {/* Trending Tags */}
      <div className="mb-8 px-4">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-yellow-400" />
          {t.trendingNow}
        </h3>
        <div className="flex flex-wrap gap-2">
          {DISCOVER_TAGS.map((tag, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-sm hover:border-gray-500 hover:text-white cursor-pointer transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
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
