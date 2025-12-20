import React from 'react';
import { User, Package, Gavel } from 'lucide-react';
import { Streamer } from '../types';
import UserBadge from './UserBadge';

interface StreamCardProps {
  streamer: Streamer;
  onPress: (streamer: Streamer) => void;
}

const StreamCard: React.FC<StreamCardProps> = ({ streamer, onPress }) => {
  return (
    <div
      onClick={() => onPress(streamer)}
      className="relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer group hover:opacity-95 transition-opacity bg-gray-800 border border-gray-800 shadow-lg"
    >
      {/* Background Image */}
      <img
        src={streamer.coverImage}
        alt={streamer.name}
        className="w-full h-full object-cover"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90"></div>

      {/* Top Left: Live Badge */}
      <div className="absolute top-2 left-2 flex items-center space-x-1 bg-red-600/90 backdrop-blur-sm px-2 py-1 rounded-md">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <span className="text-[10px] font-bold text-white uppercase tracking-wide">LIVE</span>
      </div>

      {/* Top Right: Viewer Count */}
      <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md flex items-center space-x-1">
        <User size={10} className="text-white" />
        <span className="text-[10px] text-white font-medium">{streamer.viewerCount.toLocaleString()}</span>
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex items-center space-x-2 mb-1">
          <div className="relative">
            <img
              src={streamer.avatar}
              className="w-10 h-10 rounded-full border border-white/20 object-cover"
              alt={streamer.name}
            />
            <UserBadge
              role={streamer.role}
              size="sm"
              className="absolute -top-1 -right-1"
            />
            {/* Online Indicator for Streamer (Always online when live) */}
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-black rounded-full"></div>
          </div>
          <span className="text-xs font-semibold text-gray-200 truncate">{streamer.name}</span>
        </div>

        <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight mb-2">
          {streamer.title}
        </h3>

        {streamer.isAuction ? (
          <div className="inline-flex items-center bg-gradient-to-r from-red-600 to-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-lg shadow-red-900/40">
            <Gavel size={10} className="mr-1" />
            Bid: ฿{(streamer.currentBid || streamer.auctionStartingPrice || 0).toLocaleString()}
          </div>
        ) : (
          <div className="inline-flex items-center bg-yellow-500/90 text-black px-2 py-0.5 rounded text-[10px] font-bold">
            <Package size={10} className="mr-1" />
            {streamer.itemCount} Products
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamCard;
