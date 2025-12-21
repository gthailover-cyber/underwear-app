
import React from 'react';
import { MapPin, Pencil, Grid, Settings, Crown, Star, User, Camera, Share2, MessageCircle, Heart, CheckCircle, BicepsFlexed, ChevronRight, Video, Package, ArrowLeft } from 'lucide-react';
import { UserProfile, Language, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import UserBadge from './UserBadge';

interface ProfileProps {
   language: Language;
   user: UserProfile;
   onEdit: () => void;
   onEditGallery: () => void;
   onUpgrade?: () => void;
   onBack?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ language, user, onEdit, onEditGallery, onUpgrade, onBack }) => {
   const t = TRANSLATIONS[language];

   // Helper to render stats to ensure consistency
   const renderPhysicalStats = (bgColor: string = 'bg-gray-900') => (
      <div className={`${bgColor} border-y border-gray-800 py-4 px-6 mb-4`}>
         <div className="flex justify-between items-center max-w-sm mx-auto">
            <div className="text-center">
               <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">{t.height}</span>
               <span className="text-xl font-bold text-white font-athletic">{user.height > 0 ? user.height : '-'} <span className="text-xs text-gray-400 font-sans">{t.cm}</span></span>
            </div>
            <div className="w-px h-8 bg-gray-800"></div>
            <div className="text-center">
               <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">{t.weight}</span>
               <span className="text-xl font-bold text-white font-athletic">{user.weight > 0 ? user.weight : '-'} <span className="text-xs text-gray-400 font-sans">{t.kg}</span></span>
            </div>
            <div className="w-px h-8 bg-gray-800"></div>
            <div className="text-center">
               <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">{t.age}</span>
               <span className="text-xl font-bold text-white font-athletic">{user.age > 0 ? user.age : '-'} <span className="text-xs text-gray-400 font-sans">{t.years}</span></span>
            </div>
         </div>
      </div>
   );

   // --- RENDER: MODEL PROFILE (PROFESSIONAL LOOK) ---
   if (user.role === 'model') {
      return (
         <div className="pb-24 animate-fade-in bg-black min-h-screen">

            {/* Immersive Hero Section */}
            <div className="relative h-[65vh] w-full">
               <img src={user.coverImage} className="w-full h-full object-cover" alt="Model Cover" />

               {/* Gradient Overlay for Text Readability */}
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

               {/* Top Controls */}
               <div className="absolute top-4 left-4 z-40">
                  {onBack && (
                     <button onClick={onBack} className="bg-black/20 backdrop-blur-md border border-white/20 p-2.5 rounded-full text-white hover:bg-white/20 transition-all">
                        <ArrowLeft size={20} />
                     </button>
                  )}
               </div>

               <div className="absolute top-4 right-4 flex gap-3">
                  <button className="bg-black/20 backdrop-blur-md border border-white/20 p-2.5 rounded-full text-white hover:bg-white/20 transition-all">
                     <Share2 size={20} />
                  </button>
                  <button
                     onClick={onEdit}
                     className="bg-black/20 backdrop-blur-md border border-white/20 p-2.5 rounded-full text-white hover:bg-white/20 transition-all"
                  >
                     <Settings size={20} />
                  </button>
               </div>

               {/* Model Info Overlay */}
               <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-start">

                  {/* Verified/Role Badge */}
                  <div className="flex items-center gap-2 mb-2">
                     <UserBadge role={user.role} size="sm" className="relative" />
                     <div className="bg-black/50 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/20 flex items-center gap-1">
                        <CheckCircle size={10} className="text-blue-400" /> Verified
                     </div>
                  </div>

                  {/* Name */}
                  <h1 className="text-5xl font-black font-athletic text-white leading-none tracking-wide uppercase drop-shadow-lg">
                     {user.username}
                  </h1>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-gray-300 text-sm mt-2 font-medium">
                     <MapPin size={14} className="text-red-500" /> {user.location}
                  </div>
               </div>
            </div>

            {/* Pro Stats Bar (Agency Style) */}
            {renderPhysicalStats('bg-gray-900')}

            {/* Social Stats for Model */}
            <div className="flex items-center justify-around px-10 py-4 bg-black border-b border-gray-900">
               <div className="text-center">
                  <span className="text-xl font-bold text-white font-athletic">{user.followers.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">{t.followers}</span>
               </div>
               <div className="w-px h-6 bg-gray-800"></div>
               <div className="text-center">
                  <span className="text-xl font-bold text-white font-athletic">{user.following.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">{t.following}</span>
               </div>
            </div>

            {/* Bio Section */}
            <div className="px-6 py-6">
               <p className="text-gray-300 text-sm leading-relaxed font-light mb-4">
                  "{user.bio}"
               </p>

               {/* Tags */}
               <div className="flex flex-wrap gap-2 mb-6">
                  {user.favorites.map((tag, i) => (
                     <span key={i} className="px-3 py-1 bg-gray-800 text-gray-400 text-xs border border-gray-700 rounded-full">
                        #{tag}
                     </span>
                  ))}
               </div>

               {/* Service Rates for Model */}
               {(user.rate_event_live || user.rate_product_presentation || user.rate_onsite) && (
                  <div className="mb-8 p-5 bg-gray-900/40 rounded-3xl border border-gray-800/50 backdrop-blur-sm">
                     <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2 opacity-80">
                        <Crown size={14} className="text-yellow-500" /> Service Rates
                     </h3>
                     <div className="space-y-3">
                        {user.rate_event_live !== undefined && user.rate_event_live > 0 && (
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-red-900/20 flex items-center justify-center text-red-500">
                                    <Video size={14} />
                                 </div>
                                 <span className="text-gray-300 text-xs font-medium">{t.eventLiveRate}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                 <span className="text-white font-bold text-sm tracking-tight">{user.rate_event_live.toLocaleString()}</span>
                                 <span className="text-[10px] text-gray-500 font-bold uppercase">{t.perHour}</span>
                              </div>
                           </div>
                        )}

                        {user.rate_product_presentation !== undefined && user.rate_product_presentation > 0 && (
                           <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-blue-900/20 flex items-center justify-center text-blue-500">
                                    <Package size={14} />
                                 </div>
                                 <span className="text-gray-300 text-xs font-medium">{t.productPresentationRate}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                 <span className="text-white font-bold text-sm tracking-tight">{user.rate_product_presentation.toLocaleString()}</span>
                                 <span className="text-[10px] text-gray-500 font-bold uppercase">{t.perHour}</span>
                              </div>
                           </div>
                        )}

                        {user.rate_onsite !== undefined && user.rate_onsite > 0 && (
                           <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-yellow-900/20 flex items-center justify-center text-yellow-500">
                                    <MapPin size={14} />
                                 </div>
                                 <span className="text-gray-300 text-xs font-medium">{t.onsiteEventRate}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                 <span className="text-white font-bold text-sm tracking-tight">{user.rate_onsite.toLocaleString()}</span>
                                 <span className="text-[10px] text-gray-500 font-bold uppercase">{t.perHour}</span>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {/* Action Buttons */}
               <div className="flex gap-3">
                  <button
                     onClick={onEdit}
                     className="flex-1 py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                  >
                     <Pencil size={18} /> {t.editProfile}
                  </button>
                  <button
                     onClick={onEditGallery}
                     className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-xl border border-gray-700 flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
                  >
                     <Camera size={18} /> {t.editGallery}
                  </button>
               </div>
            </div>

            {/* Portfolio Gallery (Masonry/Mosaic Layout) */}
            <div className="mt-4">
               <div className="flex items-center justify-between px-6 mb-4">
                  <h3 className="text-white font-bold text-xl font-athletic tracking-wide flex items-center gap-2">
                     PORTFOLIO <span className="text-xs font-sans font-normal text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full">{user.gallery.length}</span>
                  </h3>
               </div>

               <div className="grid grid-cols-2 gap-1 px-1">
                  {user.gallery.map((img, i) => {
                     const isLarge = i % 3 === 0;
                     return (
                        <div
                           key={i}
                           className={`relative group overflow-hidden bg-gray-900 cursor-pointer ${isLarge ? 'col-span-2 aspect-[16/10]' : 'col-span-1 aspect-[3/4]'}`}
                        >
                           <img
                              src={img}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              alt={`Portfolio ${i}`}
                           />
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                        </div>
                     );
                  })}
               </div>
            </div>
         </div>
      );
   }

   // --- RENDER: ORGANIZER PROFILE (Event Manager Style) ---
   if (user.role === 'organizer') {
      return (
         <div className="pb-24 animate-fade-in bg-gray-900 min-h-screen">
            {/* Cover with Gold Tint */}
            <div className="relative h-56 w-full overflow-hidden">
               <img src={user.coverImage} className="w-full h-full object-cover" alt="Cover" />
               <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/20 via-transparent to-gray-900"></div>

               {onBack && (
                  <button onClick={onBack} className="absolute top-4 left-4 bg-black/40 backdrop-blur p-2 rounded-full text-white hover:bg-black/60 transition-colors border border-white/10">
                     <ArrowLeft size={20} />
                  </button>
               )}

               <button onClick={onEdit} className="absolute top-4 right-4 bg-black/40 backdrop-blur p-2 rounded-full text-yellow-400 hover:bg-black/60 transition-colors border border-yellow-500/30">
                  <Settings size={20} />
               </button>
            </div>

            {/* Centered Avatar with Gold Ring */}
            <div className="relative px-4 -mt-20 mb-4 flex flex-col items-center">
               <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-yellow-300 via-yellow-500 to-yellow-700 shadow-2xl shadow-yellow-900/50 relative">
                  <div className="w-full h-full rounded-full border-4 border-gray-900 bg-gray-800 overflow-hidden">
                     <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
                  </div>
                  <UserBadge role={user.role} size="md" className="absolute -top-1 -right-1" />
               </div>

               {/* Name & Badge */}
               <div className="text-center mt-3">
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2 justify-center">
                     {user.username}
                  </h1>
                  <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-yellow-900/30 border border-yellow-600/50 text-yellow-500 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                     {t.roles.organizer}
                  </div>
                  <div className="flex items-center justify-center text-gray-400 text-sm mt-2 gap-1">
                     <MapPin size={14} /> {user.location}
                  </div>
               </div>

               {/* Organizer Actions */}
               <div className="flex gap-3 mt-6 w-full max-w-sm px-4">
                  <button onClick={onEdit} className="flex-1 py-2.5 rounded-xl bg-gray-800 border border-yellow-600/30 text-white font-bold text-sm hover:bg-gray-700 transition-all">
                     {t.editProfile}
                  </button>
                  <button onClick={onEditGallery} className="flex-1 py-2.5 rounded-xl bg-yellow-600 text-black font-bold text-sm hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-900/20">
                     {t.editGallery}
                  </button>
               </div>
            </div>

            {/* Organizer Stats */}
            <div className="grid grid-cols-3 gap-2 px-6 mb-6">
               <div className="bg-gray-800/50 p-3 rounded-2xl text-center border border-gray-700/50">
                  <span className="block text-xl font-bold text-white">12</span>
                  <span className="text-[10px] text-gray-500 uppercase">Events</span>
               </div>
               <div className="bg-gray-800/50 p-3 rounded-2xl text-center border border-gray-700/50">
                  <span className="block text-xl font-bold text-white">{user.followers.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-500 uppercase">Followers</span>
               </div>
               <div className="bg-gray-800/50 p-3 rounded-2xl text-center border border-gray-700/50">
                  <span className="block text-xl font-bold text-white">4.9</span>
                  <span className="text-[10px] text-gray-500 uppercase">Rating</span>
               </div>
            </div>

            {/* Physical Stats for Organizer (Requested) */}
            {renderPhysicalStats('bg-gray-800/30 border-gray-700/50')}

            {/* Bio */}
            <div className="px-6 mb-8">
               <h3 className="text-yellow-500 text-xs font-bold uppercase mb-2 ml-1">About Organizer</h3>
               <p className="text-gray-300 text-sm leading-relaxed bg-gray-800/30 p-4 rounded-xl border border-gray-800">
                  {user.bio}
               </p>
            </div>

            {/* Past Events / Gallery */}
            <div className="border-t border-gray-800 pt-6 px-4">
               <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Grid size={18} className="text-yellow-500" /> Highlights
               </h3>
               <div className="grid grid-cols-3 gap-1">
                  {user.gallery.map((img, i) => (
                     <div key={i} className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative group">
                        <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Gallery" />
                     </div>
                  ))}
               </div>
            </div>
         </div>
      );
   }

   // --- RENDER: SUPPORTER PROFILE (Standard User) ---
   return (
      <div className="pb-24 animate-fade-in bg-black min-h-screen">
         {/* Standard Cover */}
         <div className="relative h-44 w-full overflow-hidden bg-gray-800">
            <img src={user.coverImage} className="w-full h-full object-cover opacity-70" alt="Cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>

            {onBack && (
               <button onClick={onBack} className="absolute top-4 left-4 bg-black/40 backdrop-blur p-2 rounded-full text-white hover:bg-white/20 transition-colors">
                  <ArrowLeft size={16} />
               </button>
            )}

            <button onClick={onEdit} className="absolute top-4 right-4 bg-black/40 backdrop-blur p-2 rounded-full text-white hover:bg-white/20 transition-colors">
               <Settings size={16} />
            </button>
         </div>

         {/* Centered Avatar - Simple */}
         <div className="relative px-4 -mt-16 mb-4 flex flex-col items-center">
            <div className="w-28 h-28 rounded-full border-4 border-black bg-gray-800 overflow-hidden shadow-xl relative">
               <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
               <UserBadge role={user.role} size="md" className="absolute -top-1 -right-1" />
            </div>

            <h1 className="text-xl font-bold text-white mt-3">{user.username}</h1>
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1">
               <User size={12} /> <span>{t.roles.supporter}</span>
               <span className="text-gray-600">•</span>
               <span>{user.location}</span>
            </div>
         </div>

         {/* Simple Stats */}
         <div className="flex justify-center gap-10 mb-6 border-b border-gray-800 pb-6 mx-8">
            <div className="text-center">
               <span className="block font-bold text-lg text-white">{user.following.toLocaleString()}</span>
               <span className="text-[10px] text-gray-500 uppercase tracking-wider">Following</span>
            </div>
            <div className="w-px bg-gray-800"></div>
            <div className="text-center">
               <span className="block font-bold text-lg text-white">0</span>
               <span className="text-[10px] text-gray-500 uppercase tracking-wider">Followers</span>
            </div>
         </div>

         {/* Physical Stats for Supporter (Requested) */}
         {renderPhysicalStats('bg-gray-900')}

         {/* Action Buttons */}
         <div className="flex gap-3 px-6 mb-6">
            <button
               onClick={onEdit}
               className="flex-1 py-2.5 bg-gray-800 border border-gray-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors text-sm"
            >
               <Pencil size={16} /> {t.editProfile}
            </button>
            <button
               onClick={onEditGallery}
               className="flex-1 py-2.5 bg-gray-800 border border-gray-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors text-sm"
            >
               <Camera size={16} /> {t.editGallery}
            </button>
         </div>

         {/* Bio & Interests */}
         <div className="px-6 space-y-6">
            <div className="text-center">
               <p className="text-gray-300 text-sm italic">"{user.bio || "No bio yet."}"</p>
            </div>

            <div className="text-center">
               <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-widest">{t.favorites}</h3>
               <div className="flex flex-wrap justify-center gap-2">
                  {user.favorites.map((fav, i) => (
                     <span key={i} className="px-3 py-1 bg-gray-900 border border-gray-800 rounded-full text-xs text-gray-300">
                        {fav}
                     </span>
                  ))}
               </div>
            </div>

            {/* Supporter Gallery */}
            <div className="border-t border-gray-800 pt-6">
               <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Grid size={18} className="text-gray-400" /> My Gallery
               </h3>
               {user.gallery.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1">
                     {user.gallery.map((img, i) => (
                        <div key={i} className="aspect-square bg-gray-900 overflow-hidden relative group rounded-md">
                           <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Gallery" />
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="text-center py-8 bg-gray-900/50 rounded-xl border border-gray-800">
                     <Camera size={32} className="mx-auto text-gray-600 mb-2" />
                     <p className="text-gray-500 text-xs">No photos added yet.</p>
                  </div>
               )}
            </div>

            {/* Upgrade CTA */}
            {onUpgrade && (
               <div onClick={onUpgrade} className="mt-8 bg-gradient-to-r from-yellow-900/10 to-gray-900 border border-yellow-600/20 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-yellow-500/40 transition-colors group">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
                        <Crown size={20} />
                     </div>
                     <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors">{t.upgradeTitle}</h4>
                        <p className="text-[10px] text-gray-400">Host your own events & earn</p>
                     </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
               </div>
            )}
         </div>
      </div>
   );
};

export default Profile;
