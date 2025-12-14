
import React, { useState, useEffect } from 'react';
import { MapPin, ArrowLeft, MessageCircle, UserPlus, Grid, ChevronLeft, ChevronRight, X, Star, CheckCircle, Share2, MoreVertical, BicepsFlexed, Crown, User, Calendar } from 'lucide-react';
import { Person, Language, UserProfile } from '../types';
import { TRANSLATIONS } from '../constants';

interface UserProfileDetailProps {
  language: Language;
  person: Person;
  onBack: () => void;
  onChat: () => void;
}

const UserProfileDetail: React.FC<UserProfileDetailProps> = ({ language, person, onBack, onChat }) => {
  const t = TRANSLATIONS[language];
  
  // Mock full profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const randomGallery = Array.from({ length: 15 }).map((_, i) => 
        `https://picsum.photos/400/600?random=${parseInt(person.id.replace(/\D/g, '')) + i + 100}`
    );

    const role = person.role || 'supporter';

    const mockFullProfile: UserProfile = {
      username: person.username,
      avatar: person.avatar,
      coverImage: `https://picsum.photos/800/1200?random=${parseInt(person.id.replace(/\D/g, '')) + 50}`, 
      role: role,
      age: 20 + Math.floor(Math.random() * 10),
      height: 175 + Math.floor(Math.random() * 15),
      weight: 65 + Math.floor(Math.random() * 15),
      location: 'Bangkok, Thailand',
      bio: role === 'model' 
        ? `Professional Model & Fitness Influencer. \nDM for bookings. Live streaming every night!`
        : role === 'organizer'
          ? `Top Event Organizer in Bangkok. Hosting exclusive underwear parties and auctions.`
          : `Just a fan of cool underwear and fitness. Love watching lives!`,
      favorites: ['Fashion', 'Runway', 'Fitness', 'Swimwear'],
      gallery: randomGallery,
      followers: person.followers || Math.floor(Math.random() * 5000) + 1000,
      following: Math.floor(Math.random() * 500),
    };
    setProfile(mockFullProfile);
  }, [person]);

  if (!profile) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  const handleNextImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (lightboxIndex !== null) setLightboxIndex((prev) => (prev! + 1) % profile.gallery.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (lightboxIndex !== null) setLightboxIndex((prev) => (prev! - 1 + profile.gallery.length) % profile.gallery.length);
  };

  // --- MODEL VIEW ---
  if (profile.role === 'model') {
      return (
        <div className="h-full overflow-y-auto no-scrollbar pb-0 animate-slide-in bg-black relative z-30">
            {/* Nav */}
            <div className="fixed top-0 left-0 right-0 z-50 px-4 py-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors pointer-events-auto border border-white/10">
                  <ArrowLeft size={22} />
                </button>
                <div className="flex gap-3 pointer-events-auto">
                    <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"><Share2 size={20} /></button>
                    <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"><MoreVertical size={20} /></button>
                </div>
            </div>

            {/* Hero */}
            <div className="relative h-[80vh] w-full">
               <img src={profile.coverImage} className="w-full h-full object-cover" alt="Model Cover" />
               <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90"></div>
               <div className="absolute bottom-0 left-0 right-0 px-6 pb-32 pt-6 flex flex-col items-start z-10">
                   <div className="flex items-center gap-2 mb-2 animate-fade-in">
                       <div className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-yellow-500/20">
                           <BicepsFlexed size={10} strokeWidth={3} /> Official Model
                       </div>
                       <div className="bg-white/10 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/20 flex items-center gap-1">
                           <CheckCircle size={10} className="text-blue-400" /> Verified
                       </div>
                       {person.isOnline && (
                           <div className="bg-green-600/20 backdrop-blur-md text-green-400 border border-green-500/50 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Online
                           </div>
                       )}
                   </div>
                   <h1 className="text-5xl md:text-6xl font-black font-athletic text-white leading-none tracking-wide uppercase drop-shadow-2xl mb-1">{profile.username}</h1>
                   <div className="flex items-center gap-1.5 text-gray-300 text-sm font-medium drop-shadow-md mb-4">
                       <MapPin size={16} className="text-red-500" /> {profile.location}
                   </div>
               </div>
            </div>

            {/* Body */}
            <div className="bg-black relative z-20 -mt-6 rounded-t-3xl border-t border-gray-800/50 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
                <div className="flex justify-center -mt-8 mb-6 gap-4 px-6 relative z-30">
                    <button className="flex-1 bg-red-600 hover:bg-red-700 text-white h-14 rounded-2xl font-bold text-lg shadow-lg shadow-red-900/50 flex items-center justify-center gap-2 transition-all active:scale-95"><UserPlus size={20} /> {t.follow}</button>
                    <button onClick={onChat} className="flex-1 bg-white hover:bg-gray-200 text-black h-14 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"><MessageCircle size={20} /> Chat</button>
                </div>
                {/* Stats */}
                <div className="flex items-center justify-around px-6 mb-6">
                    <div className="text-center"><span className="text-2xl font-bold text-white font-athletic">{profile.followers.toLocaleString()}</span><span className="text-xs text-gray-500 uppercase tracking-wider block">{t.followers}</span></div>
                    <div className="w-px h-8 bg-gray-800"></div>
                    <div className="text-center"><span className="text-2xl font-bold text-white font-athletic">{profile.following.toLocaleString()}</span><span className="text-xs text-gray-500 uppercase tracking-wider block">{t.following}</span></div>
                </div>
                {/* Gallery */}
                <div className="pb-24">
                    <div className="flex items-center justify-between px-6 mb-4">
                        <h3 className="text-white font-bold text-xl font-athletic tracking-wide flex items-center gap-2">PORTFOLIO <span className="text-xs font-sans font-normal text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full">{profile.gallery.length}</span></h3>
                    </div>
                    <div className="grid grid-cols-2 gap-1 px-1">
                        {profile.gallery.map((img, i) => (
                            <div key={i} onClick={() => setLightboxIndex(i)} className={`relative group overflow-hidden bg-gray-900 cursor-pointer ${i % 3 === 0 ? 'col-span-2 aspect-[16/10]' : 'col-span-1 aspect-[3/4]'}`}>
                               <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Lightbox logic remains same, abstracted for brevity in this snippet but assumed present */}
            {lightboxIndex !== null && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in" onClick={() => setLightboxIndex(null)}>
                    <img src={profile.gallery[lightboxIndex]} className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg shadow-2xl" />
                    <button onClick={() => setLightboxIndex(null)} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white"><X size={24} /></button>
                </div>
            )}
        </div>
      );
  }

  // --- ORGANIZER VIEW ---
  if (profile.role === 'organizer') {
      return (
        <div className="h-full overflow-y-auto no-scrollbar pb-24 animate-slide-in bg-gray-900 relative z-30">
            {/* Nav */}
            <div className="fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between pointer-events-none">
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 pointer-events-auto border border-white/10"><ArrowLeft size={22} /></button>
                <div className="flex gap-2 pointer-events-auto">
                    <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 border border-white/10"><Share2 size={18} /></button>
                    <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 border border-white/10"><MoreVertical size={18} /></button>
                </div>
            </div>

            <div className="relative h-56 w-full overflow-hidden">
               <img src={profile.coverImage} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/40 via-transparent to-gray-900"></div>
            </div>

            <div className="relative px-4 -mt-20 mb-4 flex flex-col items-center">
                <div className="relative">
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-yellow-300 via-yellow-500 to-yellow-700 shadow-2xl shadow-yellow-900/50">
                       <div className="w-full h-full rounded-full border-4 border-gray-900 bg-gray-800 overflow-hidden">
                          <img src={profile.avatar} className="w-full h-full object-cover" />
                       </div>
                    </div>
                    {person.isOnline && (
                        <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-4 border-gray-900 shadow-lg"></div>
                    )}
                </div>
                
                <div className="text-center mt-3">
                   <h1 className="text-2xl font-bold text-white flex items-center gap-2 justify-center">
                      {profile.username} 
                      <Crown size={20} className="text-yellow-500 fill-yellow-500" />
                   </h1>
                   <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-yellow-900/30 border border-yellow-600/50 text-yellow-500 text-[10px] font-bold uppercase tracking-wider">
                      {t.roles.organizer}
                   </div>
                   <div className="flex items-center justify-center text-gray-400 text-sm mt-2 gap-1">
                      <MapPin size={14} /> {profile.location}
                   </div>
                </div>

                <div className="flex gap-3 mt-6 w-full max-w-sm">
                    <button className="flex-1 py-2.5 rounded-xl bg-yellow-600 text-black font-bold text-sm hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-900/20 flex items-center justify-center gap-2">
                       <UserPlus size={18} /> {t.follow}
                    </button>
                    <button onClick={onChat} className="flex-1 py-2.5 rounded-xl bg-gray-800 border border-yellow-600/30 text-white font-bold text-sm hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                       <MessageCircle size={18} /> Chat
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 px-6 mb-6">
                <div className="bg-gray-800/50 p-3 rounded-2xl text-center border border-gray-700/50"><span className="block text-xl font-bold text-white">24</span><span className="text-[10px] text-gray-500 uppercase">Events</span></div>
                <div className="bg-gray-800/50 p-3 rounded-2xl text-center border border-gray-700/50"><span className="block text-xl font-bold text-white">{profile.followers.toLocaleString()}</span><span className="text-[10px] text-gray-500 uppercase">{t.followers}</span></div>
                <div className="bg-gray-800/50 p-3 rounded-2xl text-center border border-gray-700/50"><span className="block text-xl font-bold text-white">5.0</span><span className="text-[10px] text-gray-500 uppercase">Rating</span></div>
            </div>

            <div className="px-6 mb-8">
               <h3 className="text-yellow-500 text-xs font-bold uppercase mb-2 ml-1">About</h3>
               <p className="text-gray-300 text-sm leading-relaxed bg-gray-800/30 p-4 rounded-xl border border-gray-800">{profile.bio}</p>
            </div>

            <div className="border-t border-gray-800 pt-6 px-4">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Calendar size={18} className="text-yellow-500"/> Past Events</h3>
                <div className="grid grid-cols-2 gap-3">
                   {profile.gallery.slice(0,4).map((img, i) => (
                      <div key={i} className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative group">
                         <img src={img} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                      </div>
                   ))}
                </div>
            </div>
        </div>
      );
  }

  // --- STANDARD SUPPORTER VIEW ---
  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-24 animate-slide-in bg-black relative z-30">
      <div className="fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between pointer-events-none">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 pointer-events-auto border border-white/10"><ArrowLeft size={22} /></button>
      </div>

      <div className="relative h-44 w-full bg-gray-800 overflow-hidden">
        <img src={profile.coverImage} className="w-full h-full object-cover opacity-70" alt="Cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      </div>

      <div className="relative px-4 -mt-16 mb-4 flex flex-col items-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-black bg-gray-800 overflow-hidden shadow-xl">
              <img src={profile.avatar} className="w-full h-full object-cover" alt="Profile" />
            </div>
            {person.isOnline && (
               <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-4 border-black"></div>
            )}
          </div>
          
          <h1 className="text-xl font-bold text-white mt-3">{profile.username}</h1>
          <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1">
             <User size={12} /> <span>{t.roles.supporter}</span>
             <span className="text-gray-600">•</span>
             <span>{profile.location}</span>
          </div>

          <div className="flex gap-3 mt-5">
            <button className="px-6 py-2 bg-red-600 rounded-full text-white font-bold flex items-center gap-2 hover:bg-red-700 shadow-lg shadow-red-900/40 active:scale-95 transition-all text-sm">
               <UserPlus size={16} /> {t.follow}
            </button>
            <button onClick={onChat} className="px-6 py-2 bg-gray-800 border border-gray-700 rounded-full text-white font-bold flex items-center gap-2 hover:bg-gray-700 active:scale-95 transition-all text-sm">
               <MessageCircle size={16} /> Chat
            </button>
          </div>
      </div>

      <div className="flex justify-center gap-10 mb-8 border-b border-gray-800 pb-6 mx-8">
           <div className="text-center">
              <span className="block font-bold text-lg text-white">{profile.following.toLocaleString()}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Following</span>
           </div>
           <div className="w-px bg-gray-800"></div>
           <div className="text-center">
              <span className="block font-bold text-lg text-white">{profile.followers.toLocaleString()}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Followers</span>
           </div>
      </div>

      <div className="px-6 text-center">
         <p className="text-gray-300 text-sm italic mb-6">"{profile.bio}"</p>
         <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-widest">{t.favorites}</h3>
         <div className="flex flex-wrap justify-center gap-2">
            {profile.favorites.map((fav, i) => (
               <span key={i} className="px-3 py-1 bg-gray-900 border border-gray-800 rounded-full text-xs text-gray-300">
                  {fav}
               </span>
            ))}
         </div>
      </div>

      {/* Gallery Section */}
      <div className="mt-8 border-t border-gray-800 pt-6">
         <h3 className="px-6 text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Grid size={18} className="text-gray-400"/> Gallery
         </h3>
         <div className="grid grid-cols-3 gap-0.5 px-0.5">
            {profile.gallery.map((img, i) => (
               <div key={i} onClick={() => setLightboxIndex(i)} className="aspect-square bg-gray-900 cursor-pointer overflow-hidden relative group">
                  <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Gallery" />
               </div>
            ))}
         </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in" onClick={() => setLightboxIndex(null)}>
              <img src={profile.gallery[lightboxIndex]} className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg shadow-2xl" />
              <button onClick={() => setLightboxIndex(null)} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white"><X size={24} /></button>
          </div>
      )}
    </div>
  );
};

export default UserProfileDetail;
