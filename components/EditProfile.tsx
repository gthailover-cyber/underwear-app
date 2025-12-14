
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Save, X, Plus, User, MapPin, AlignLeft, Hash, Ruler, Weight, Calendar, ChevronLeft, ChevronDown } from 'lucide-react';
import { UserProfile, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface EditProfileProps {
  language: Language;
  initialData: UserProfile;
  onSave: (data: UserProfile) => void;
  onCancel: () => void;
}

const LOCATIONS: { [key: string]: string[] } = {
  "Thailand": [
    "Bangkok", "Amnat Charoen", "Ang Thong", "Bueng Kan", "Buriram", 
    "Chachoengsao", "Chai Nat", "Chaiyaphum", "Chanthaburi", "Chiang Mai", "Chiang Rai", "Chon Buri", "Chumphon", 
    "Kalasin", "Kamphaeng Phet", "Kanchanaburi", "Khon Kaen", "Krabi", 
    "Lampang", "Lamphun", "Loei", "Lopburi", 
    "Mae Hong Son", "Maha Sarakham", "Mukdahan", 
    "Nakhon Nayok", "Nakhon Pathom", "Nakhon Phanom", "Nakhon Ratchasima", "Nakhon Sawan", "Nakhon Si Thammarat", "Nan", "Narathiwat", "Nong Bua Lamphu", "Nong Khai", "Nonthaburi", 
    "Pathum Thani", "Pattani", "Phang Nga", "Phatthalung", "Phayao", "Phetchabun", "Phetchaburi", "Phichit", "Phitsanulok", "Phra Nakhon Si Ayutthaya", "Phrae", "Phuket", 
    "Prachin Buri", "Prachuap Khiri Khan", 
    "Ranong", "Ratchaburi", "Rayong", "Roi Et", 
    "Sa Kaeo", "Sakon Nakhon", "Samut Prakan", "Samut Sakhon", "Samut Songkhram", "Saraburi", "Satun", "Sing Buri", "Sisaket", "Songkhla", "Sukhothai", "Suphan Buri", "Surat Thani", "Surin", 
    "Tak", "Trang", "Trat", 
    "Ubon Ratchathani", "Udon Thani", "Uthai Thani", "Uttaradit", 
    "Yala", "Yasothon"
  ].sort((a, b) => a === "Bangkok" ? -1 : b === "Bangkok" ? 1 : a.localeCompare(b)), // Put Bangkok first, others sorted
  "USA": ["New York", "Los Angeles", "Chicago", "Miami", "San Francisco", "Las Vegas", "Seattle", "Austin", "Boston", "Denver", "Washington D.C.", "Houston", "Atlanta"],
  "Japan": ["Tokyo", "Osaka", "Kyoto", "Sapporo", "Fukuoka", "Nagoya", "Yokohama", "Kobe", "Hiroshima", "Okinawa"],
  "South Korea": ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Ulsan", "Jeju"],
  "China": ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Chongqing", "Tianjin", "Wuhan", "Xi'an", "Hangzhou"],
  "Singapore": ["Singapore"],
  "United Kingdom": ["London", "Manchester", "Liverpool", "Birmingham", "Edinburgh", "Glasgow", "Bristol", "Leeds"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra", "Hobart"],
  "Other": ["Other City"]
};

const EditProfile: React.FC<EditProfileProps> = ({ language, initialData, onSave, onCancel }) => {
  const t = TRANSLATIONS[language];
  const [formData, setFormData] = useState<UserProfile>(initialData);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Location State
  // Try to parse existing "City, Country" format, fallback to default
  const initialLocParts = initialData.location ? initialData.location.split(', ') : [];
  // Find country in our list that matches the end of the string, or default to Thailand
  const matchedCountry = Object.keys(LOCATIONS).find(c => initialData.location?.endsWith(c)) || 'Thailand';
  const initialCountry = matchedCountry;
  // Try to find city, or default to first city of that country
  const initialCity = initialLocParts.length > 1 ? initialLocParts[0] : LOCATIONS[initialCountry][0];

  const [country, setCountry] = useState(initialCountry);
  const [city, setCity] = useState(initialCity);
  
  // File state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  
  // Refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  // Location Handlers
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    const defaultCity = LOCATIONS[newCountry][0];
    setCountry(newCountry);
    setCity(defaultCity);
    setFormData(prev => ({ ...prev, location: `${defaultCity}, ${newCountry}` }));
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCity = e.target.value;
    setCity(newCity);
    setFormData(prev => ({ ...prev, location: `${newCity}, ${country}` }));
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

  // --- FILE HANDLING ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
      const file = e.target.files?.[0];
      if (!file) return;

      const previewUrl = URL.createObjectURL(file);
      
      if (type === 'avatar') {
          setAvatarFile(file);
          setFormData(prev => ({ ...prev, avatar: previewUrl }));
      } else {
          setCoverFile(file);
          setFormData(prev => ({ ...prev, coverImage: previewUrl }));
      }
  };

  // Utility to resize image before upload
  const resizeImage = (file: File, maxWidth: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas to Blob failed'));
            }, 'image/jpeg', 0.8); // 80% quality JPEG
          } else {
            reject(new Error('Canvas context failed'));
          }
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const uploadImageToSupabase = async (file: File, folder: string, maxWidth: number = 800): Promise<string | null> => {
      try {
          // 1. Resize Image
          const resizedBlob = await resizeImage(file, maxWidth);
          
          // 2. Prepare Upload
          const fileExt = 'jpg'; // We convert to jpeg in resize function
          const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          // 3. Upload to 'gunderwear-bucket'
          const { error: uploadError } = await supabase.storage
              .from('gunderwear-bucket') 
              .upload(fileName, resizedBlob, {
                contentType: 'image/jpeg'
              });

          if (uploadError) throw uploadError;

          // 4. Get Public URL
          const { data } = supabase.storage
              .from('gunderwear-bucket')
              .getPublicUrl(fileName);
          
          return data.publicUrl;
      } catch (error: any) {
          console.error(`Error uploading ${folder}:`, error);
          alert(`Failed to upload image: ${error.message || 'Unknown error'}`);
          return null;
      }
  };

  const handleSaveClick = async () => {
    setIsLoading(true);
    
    let finalAvatar = formData.avatar;
    let finalCover = formData.coverImage;

    // Upload files if changed (checked by file existence in state)
    // Avatar resize to 500px width
    if (avatarFile) {
        const url = await uploadImageToSupabase(avatarFile, 'avatars', 500);
        if (url) finalAvatar = url;
    }

    // Cover resize to 1200px width
    if (coverFile) {
        const url = await uploadImageToSupabase(coverFile, 'covers', 1200);
        if (url) finalCover = url;
    }

    const updatedProfile = {
        ...formData,
        avatar: finalAvatar,
        coverImage: finalCover
    };

    // Pass back to parent for DB save
    onSave(updatedProfile);
    // Loading state will be handled by parent or just persist here for a moment
    setTimeout(() => setIsLoading(false), 500); 
  };

  return (
    <div className="pb-32 animate-fade-in bg-black min-h-screen">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-black/90 backdrop-blur z-30 border-b border-gray-800">
        <button 
          onClick={onCancel}
          className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>
        <h2 className="text-lg font-bold text-white font-athletic tracking-wide">{t.editProfile}</h2>
        <button 
          onClick={handleSaveClick}
          disabled={isLoading}
          className="text-red-500 hover:text-red-400 font-bold bg-red-900/10 px-3 py-1.5 rounded-lg border border-red-900/30 flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
             <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
             <Save size={18} /> 
          )}
          <span className="hidden sm:inline">{isLoading ? t.saving : t.save}</span>
        </button>
      </div>

      <div className="p-4 space-y-8 max-w-lg mx-auto">
        
        {/* Hidden Inputs */}
        <input 
            type="file" 
            ref={avatarInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'avatar')}
        />
        <input 
            type="file" 
            ref={coverInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'cover')}
        />

        {/* Images Section */}
        <div className="relative">
          {/* Cover Image */}
          <div 
            onClick={() => coverInputRef.current?.click()}
            className="relative h-44 w-full rounded-2xl overflow-hidden bg-gray-800 group cursor-pointer border border-gray-700 shadow-lg"
          >
            <img src={formData.coverImage} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
               <span className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-bold border border-white/20 shadow-xl pointer-events-none">
                 <Camera size={14} /> {t.changeCover}
               </span>
            </div>
          </div>
          
          {/* Avatar */}
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
            <div 
                onClick={() => avatarInputRef.current?.click()}
                className="relative w-28 h-28 rounded-full border-4 border-black bg-gray-800 overflow-hidden group cursor-pointer shadow-2xl"
            >
              <img src={formData.avatar} className="w-full h-full object-cover group-hover:opacity-60 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <Camera size={24} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="h-4"></div> {/* Spacer for avatar */}

        {/* Section: Personal Info */}
        <div className="space-y-4">
           <h3 className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">
              {t.personalInfo}
           </h3>

           <div className="space-y-4">
             <div className="relative">
               <div className="absolute left-3 top-3.5 text-gray-500"><User size={18} /></div>
               <input 
                 type="text" 
                 name="username"
                 placeholder={t.username}
                 value={formData.username}
                 onChange={handleChange}
                 className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 transition-all font-bold"
               />
             </div>

             {/* Location Dropdown Group */}
             <div className="relative">
               <div className="absolute left-3 top-3.5 text-gray-500 z-10"><MapPin size={18} /></div>
               <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                      <select
                        value={country}
                        onChange={handleCountryChange}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-8 text-white appearance-none focus:border-red-600 focus:outline-none transition-all cursor-pointer truncate"
                      >
                         {Object.keys(LOCATIONS).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="absolute right-3 top-4 pointer-events-none text-gray-500">
                         <ChevronDown size={14} />
                      </div>
                  </div>
                  <div className="relative">
                      <select
                        value={city}
                        onChange={handleCityChange}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-4 pr-8 text-white appearance-none focus:border-red-600 focus:outline-none transition-all cursor-pointer truncate"
                      >
                         {LOCATIONS[country].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="absolute right-3 top-4 pointer-events-none text-gray-500">
                         <ChevronDown size={14} />
                      </div>
                  </div>
               </div>
             </div>

             <div className="relative">
               <div className="absolute left-3 top-3.5 text-gray-500"><AlignLeft size={18} /></div>
               <textarea 
                 name="bio"
                 placeholder={t.aboutMe}
                 value={formData.bio}
                 onChange={handleChange}
                 rows={4}
                 className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-red-600 focus:outline-none transition-all resize-none text-sm leading-relaxed"
               />
             </div>
           </div>
        </div>

        {/* Section: Physical Stats */}
        <div>
          <h3 className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">
              {t.physicalStats}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex flex-col items-center justify-center gap-1 group focus-within:border-red-600 transition-colors">
               <div className="flex items-center gap-1 text-gray-500 text-xs font-medium uppercase">
                  <Calendar size={12} /> {t.age}
               </div>
               <input 
                 type="number" 
                 name="age"
                 value={formData.age}
                 onChange={handleChange}
                 className="w-full bg-transparent text-center font-athletic text-2xl text-white focus:outline-none"
               />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex flex-col items-center justify-center gap-1 group focus-within:border-red-600 transition-colors">
               <div className="flex items-center gap-1 text-gray-500 text-xs font-medium uppercase">
                  <Ruler size={12} /> {t.height}
               </div>
               <div className="flex items-baseline gap-1">
                 <input 
                   type="number" 
                   name="height"
                   value={formData.height}
                   onChange={handleChange}
                   className="w-16 bg-transparent text-right font-athletic text-2xl text-white focus:outline-none"
                 />
                 <span className="text-xs text-gray-600 font-bold">cm</span>
               </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex flex-col items-center justify-center gap-1 group focus-within:border-red-600 transition-colors">
               <div className="flex items-center gap-1 text-gray-500 text-xs font-medium uppercase">
                  <Weight size={12} /> {t.weight}
               </div>
               <div className="flex items-baseline gap-1">
                 <input 
                   type="number" 
                   name="weight"
                   value={formData.weight}
                   onChange={handleChange}
                   className="w-16 bg-transparent text-right font-athletic text-2xl text-white focus:outline-none"
                 />
                 <span className="text-xs text-gray-600 font-bold">kg</span>
               </div>
            </div>
          </div>
        </div>

        {/* Section: Favorites / Tags */}
        <div>
           <h3 className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">
              {t.favorites}
           </h3>
           
           <div className="flex gap-2 mb-3">
             <div className="relative flex-1">
               <Hash size={16} className="absolute left-3 top-3.5 text-gray-500" />
               <input 
                 type="text" 
                 value={newTag}
                 onChange={(e) => setNewTag(e.target.value)}
                 placeholder={t.enterTagPlaceholder}
                 className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-red-600 focus:outline-none transition-colors"
                 onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
               />
             </div>
             <button 
               onClick={handleAddTag}
               disabled={!newTag.trim()}
               className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white p-3 rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors"
             >
               <Plus size={20} />
             </button>
           </div>

           <div className="flex flex-wrap gap-2">
             {formData.favorites.map((tag, idx) => (
               <div key={idx} className="flex items-center gap-1 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 text-gray-200 px-3 py-1.5 rounded-lg text-sm shadow-sm animate-fade-in group">
                 <span>#{tag}</span>
                 <button onClick={() => handleRemoveTag(idx)} className="text-gray-500 hover:text-red-500 transition-colors">
                    <X size={14} />
                 </button>
               </div>
             ))}
             {formData.favorites.length === 0 && (
                <p className="text-gray-500 text-xs italic py-2">Add tags to help people find you (e.g., Fitness, Model, Fashion)</p>
             )}
           </div>
        </div>

        {/* Bottom Save Button (Mobile Friendly) */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur border-t border-gray-800 md:hidden">
            <button 
                onClick={handleSaveClick}
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <>
                        <Save size={20} /> {t.save}
                    </>
                )}
            </button>
        </div>

      </div>
    </div>
  );
};

export default EditProfile;
