
import React, { useState } from 'react';
import { Users, Crown, User, BicepsFlexed, UserPlus, UserCheck } from 'lucide-react';
import { Language, Person, UserRole, Streamer } from '../types';
import { TRANSLATIONS } from '../constants';
import UserBadge from './UserBadge';

interface PeopleProps {
  language: Language;
  onUserClick: (person: Person) => void;
  streamers: Streamer[];
  people: Person[]; // Added people prop
  onFollow?: (id: string) => void;
  followingIds?: string[];
}

const People: React.FC<PeopleProps> = ({ language, onUserClick, streamers, people, onFollow, followingIds = [] }) => {
  const t = TRANSLATIONS[language];
  const [filter, setFilter] = useState<'all' | UserRole>('all');

  const filteredPeople = people.filter(p => {
    if (filter === 'all') return true;
    return p.role === filter;
  });

  const getRoleIcon = (role?: UserRole) => {
    switch (role) {
      case 'organizer': return <Crown size={12} className="text-black fill-black" />;
      case 'model': return <BicepsFlexed size={12} className="text-black" strokeWidth={3} />;
      default: return null;
    }
  };

  const getRoleColor = (role?: UserRole) => {
    switch (role) {
      case 'organizer': return 'bg-yellow-500';
      case 'model': return 'bg-white';
      default: return 'hidden';
    }
  };

  const filters: { id: 'all' | UserRole; label: string; icon?: React.ReactNode }[] = [
    { id: 'all', label: t.status.all },
    { id: 'supporter', label: t.roles.supporter, icon: <User size={14} /> },
    { id: 'model', label: t.roles.model, icon: <BicepsFlexed size={14} /> },
    { id: 'organizer', label: t.roles.organizer, icon: <Crown size={14} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-black">

      {/* Header - Sits directly under global Topbar */}
      <div className="px-4 py-3 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-athletic text-white tracking-wide flex items-center gap-2">
            <Users className="text-red-600" size={20} />
            {t.people}
          </h2>
          <p className="text-xs text-gray-500">Discover new people</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${filter === f.id
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid - Scrollable Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {filteredPeople.length > 0 ? (
          <div className="grid grid-cols-3 gap-0.5 px-0.5">
            {filteredPeople.map((person) => {
              // Check if this person is currently live
              const isLive = streamers.some(s => s.name === person.username);

              return (
                <div
                  key={person.id}
                  onClick={() => onUserClick(person)}
                  className="relative aspect-square bg-gray-900 group cursor-pointer overflow-hidden"
                >
                  <img
                    src={person.avatar}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt={person.username}
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"></div>

                  <UserBadge
                    role={person.role}
                    size="sm"
                    className="absolute top-2 right-2"
                  />

                  {/* LIVE Status or Online Dot (Bottom Right/Left of Image Area) */}
                  {isLive ? (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 z-20 shadow-md animate-pulse">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
                    </div>
                  ) : person.isOnline ? (
                    <div className="absolute top-2 left-2 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black shadow-[0_0_8px_rgba(34,197,94,0.8)] z-10 animate-pulse"></div>
                  ) : null}

                  {/* Info */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between z-10">
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-white truncate text-shadow-sm leading-tight">
                        {person.username}
                      </span>
                      <span className="text-[9px] text-gray-400 truncate">
                        {person.followers?.toLocaleString()} Followers
                      </span>
                    </div>

                    {onFollow && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFollow(person.id);
                        }}
                        className={`ml-2 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 ${followingIds.includes(person.id)
                          ? 'bg-gray-800/80 text-white'
                          : 'bg-red-600/90 text-white'
                          }`}
                      >
                        {followingIds.includes(person.id) ? <UserCheck size={14} /> : <UserPlus size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Users size={48} className="mb-4 opacity-30" />
            <p>No users found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default People;
