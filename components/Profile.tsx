
import React from 'react';
import { MapPin, Pencil, Grid, Settings } from 'lucide-react';
import { UserProfile, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface ProfileProps {
  language: Language;
  user: UserProfile;
  onEdit: () => void;
  onEditGallery: () => void;
}

const Profile: React.FC<ProfileProps> = ({ language, user, onEdit, onEditGallery }) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="pb-24 animate-fade-in">
      
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 w-full bg-gray-800 overflow-hidden">
        <img src={user.coverImage} className="w-full h-full object-cover opacity-80" alt="Cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        <button className="absolute top-4 right-4 bg-black/40 backdrop-blur p-2 rounded-full text-white hover:bg-white/20 transition-colors">
          <Settings size={20} />
        </button>
      </div>

      {/* Profile Header Info */}
      <div className="relative px-4 -mt-16 mb-6">
        <div className="flex flex-col items-center">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full border-4 border-black bg-gray-800 overflow-hidden shadow-2xl relative">
            <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
            <button className="absolute bottom-0 right-0 left-0 bg-black/60 text-white text-[10px] py-1 text-center backdrop-blur-sm">
              Change
            </button>
          </div>
          
          {/* Name & Location */}
          <div className="text-center mt-3">
            <h1 className="text-2xl font-athletic tracking-wide text-white">{user.username}</h1>
            <div className="flex items-center justify-center text-gray-400 text-sm mt-1 gap-1">
              <MapPin size={14} className="text-red-500" />
              <span>{user.location}</span>
            </div>
          </div>

          {/* Edit Button */}
          <button 
            onClick={onEdit}
            className="mt-4 px-6 py-2 bg-gray-800 border border-gray-700 rounded-full text-sm font-bold text-white flex items-center gap-2 hover:bg-gray-700 transition-colors"
          >
            <Pencil size={14} />
            {t.editProfile}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 mb-8">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t.age, value: user.age, unit: t.years },
            { label: t.height, value: user.height, unit: t.cm },
            { label: t.weight, value: user.weight, unit: t.kg },
          ].map((stat, idx) => (
            <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-3 text-center">
              <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">{stat.label}</span>
              <div className="text-2xl font-athletic text-white">
                {stat.value}
                <span className="text-sm font-sans text-gray-400 ml-1">{stat.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bio & Preferences */}
      <div className="px-6 mb-8 space-y-6">
        {/* Bio */}
        <div>
           <h3 className="text-white font-bold mb-2 flex items-center gap-2 text-sm uppercase text-gray-400">
             {t.aboutMe}
           </h3>
           <p className="text-gray-300 text-sm leading-relaxed">{user.bio}</p>
        </div>

        {/* Preferences */}
        <div>
           <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm uppercase text-gray-400">
             {t.favorites}
           </h3>
           <div className="flex flex-wrap gap-2">
             {user.favorites.map((fav, i) => (
               <span 
                 key={i} 
                 className="px-3 py-1 bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg text-xs font-medium"
               >
                 {fav}
               </span>
             ))}
           </div>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="border-t border-gray-800 pt-6">
         <div className="flex items-center justify-between px-4 mb-4">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
               <Grid size={18} className="text-red-500"/>
               {t.gallery}
            </h3>
            <button 
              onClick={onEditGallery}
              className="text-xs font-bold text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700 transition-colors"
            >
               {t.editGallery}
            </button>
         </div>

         {/* Grid */}
         <div className="grid grid-cols-3 gap-0.5">
            {user.gallery.map((img, i) => (
              <div key={i} className="aspect-square bg-gray-900 relative group overflow-hidden cursor-pointer">
                <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={`Gallery ${i}`} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
              </div>
            ))}
         </div>
      </div>

    </div>
  );
};

export default Profile;
