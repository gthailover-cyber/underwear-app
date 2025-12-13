import React, { useState } from 'react';
import { Camera, Save, X, Plus } from 'lucide-react';
import { UserProfile, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface EditProfileProps {
  language: Language;
  initialData: UserProfile;
  onSave: (data: UserProfile) => void;
  onCancel: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ language, initialData, onSave, onCancel }) => {
  const t = TRANSLATIONS[language];
  const [formData, setFormData] = useState<UserProfile>(initialData);
  const [newTag, setNewTag] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        favorites: [...prev.favorites, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      favorites: prev.favorites.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="pb-24 animate-fade-in bg-black min-h-screen">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-black/80 backdrop-blur z-20 border-b border-gray-800">
        <button 
          onClick={onCancel}
          className="text-gray-400 hover:text-white font-medium"
        >
          {t.cancel}
        </button>
        <h2 className="text-lg font-bold text-white">{t.editProfile}</h2>
        <button 
          onClick={() => onSave(formData)}
          className="text-red-500 hover:text-red-400 font-bold"
        >
          {t.save}
        </button>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Images */}
        <div className="space-y-4">
          <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-gray-800 group cursor-pointer border border-gray-700">
            <img src={formData.coverImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full text-white text-xs font-bold border border-white/20">
                 <Camera size={14} /> {t.changeCover}
               </span>
            </div>
          </div>
          
          <div className="flex justify-center -mt-16 relative z-10">
            <div className="relative w-28 h-28 rounded-full border-4 border-black bg-gray-800 overflow-hidden group cursor-pointer">
              <img src={formData.avatar} className="w-full h-full object-cover group-hover:opacity-60 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
           <div className="space-y-1">
             <label className="text-xs text-gray-500 font-bold uppercase ml-1">{t.username}</label>
             <input 
               type="text" 
               name="username"
               value={formData.username}
               onChange={handleChange}
               className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 transition-all font-bold tracking-wide"
             />
           </div>

           <div className="space-y-1">
             <label className="text-xs text-gray-500 font-bold uppercase ml-1">{t.location}</label>
             <input 
               type="text" 
               name="location"
               value={formData.location}
               onChange={handleChange}
               className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none transition-all"
             />
           </div>

           <div className="space-y-1">
             <label className="text-xs text-gray-500 font-bold uppercase ml-1">{t.aboutMe}</label>
             <textarea 
               name="bio"
               value={formData.bio}
               onChange={handleChange}
               rows={4}
               className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none transition-all resize-none text-sm"
             />
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
             <label className="text-xs text-gray-500 font-bold uppercase ml-1 text-center block">{t.age}</label>
             <input 
               type="number" 
               name="age"
               value={formData.age}
               onChange={handleChange}
               className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white text-center font-athletic text-xl focus:border-red-600 focus:outline-none"
             />
          </div>
          <div className="space-y-1">
             <label className="text-xs text-gray-500 font-bold uppercase ml-1 text-center block">{t.height} (cm)</label>
             <input 
               type="number" 
               name="height"
               value={formData.height}
               onChange={handleChange}
               className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white text-center font-athletic text-xl focus:border-red-600 focus:outline-none"
             />
          </div>
          <div className="space-y-1">
             <label className="text-xs text-gray-500 font-bold uppercase ml-1 text-center block">{t.weight} (kg)</label>
             <input 
               type="number" 
               name="weight"
               value={formData.weight}
               onChange={handleChange}
               className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white text-center font-athletic text-xl focus:border-red-600 focus:outline-none"
             />
          </div>
        </div>

        {/* Favorites Tags */}
        <div className="space-y-2">
           <label className="text-xs text-gray-500 font-bold uppercase ml-1">{t.favorites}</label>
           <div className="flex flex-wrap gap-2 mb-2">
             {formData.favorites.map((tag, idx) => (
               <div key={idx} className="flex items-center gap-1 bg-red-900/20 border border-red-900/50 text-red-400 px-3 py-1.5 rounded-lg text-sm">
                 <span>{tag}</span>
                 <button onClick={() => handleRemoveTag(idx)} className="hover:text-white"><X size={14}/></button>
               </div>
             ))}
           </div>
           
           <div className="flex gap-2">
             <input 
               type="text" 
               value={newTag}
               onChange={(e) => setNewTag(e.target.value)}
               placeholder={t.enterTagPlaceholder}
               className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-3 text-white text-sm focus:border-red-600 focus:outline-none"
               onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
             />
             <button 
               onClick={handleAddTag}
               className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white p-3 rounded-xl flex items-center justify-center"
             >
               <Plus size={20} />
             </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default EditProfile;