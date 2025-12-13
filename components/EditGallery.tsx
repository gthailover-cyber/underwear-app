import React, { useState } from 'react';
import { X, Plus, Save, Trash2, ImagePlus } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface EditGalleryProps {
  language: Language;
  initialGallery: string[];
  onSave: (gallery: string[]) => void;
  onCancel: () => void;
}

const EditGallery: React.FC<EditGalleryProps> = ({ language, initialGallery, onSave, onCancel }) => {
  const t = TRANSLATIONS[language];
  const [gallery, setGallery] = useState<string[]>(initialGallery);

  const handleDelete = (index: number) => {
    setGallery(prev => prev.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    // Mock adding an image by generating a random one
    const newImage = `https://picsum.photos/300/400?random=${Date.now()}`;
    setGallery(prev => [newImage, ...prev]);
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
        <h2 className="text-lg font-bold text-white">{t.editGalleryTitle}</h2>
        <button 
          onClick={() => onSave(gallery)}
          className="text-red-500 hover:text-red-400 font-bold"
        >
          {t.save}
        </button>
      </div>

      <div className="p-4">
        
        {/* Upload Button */}
        <button 
          onClick={handleAdd}
          className="w-full h-24 mb-6 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-red-600 hover:bg-gray-900/50 transition-all gap-2 group"
        >
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-red-600 transition-colors">
            <ImagePlus size={16} className="group-hover:text-white" />
          </div>
          <span className="text-sm font-bold">{t.uploadImage}</span>
        </button>

        {/* Gallery Grid */}
        <div className="grid grid-cols-3 gap-2">
          {gallery.map((img, i) => (
            <div key={i} className="aspect-square relative group rounded-xl overflow-hidden bg-gray-900 shadow-md">
              <img src={img} className="w-full h-full object-cover" alt="" />
              
              {/* Delete Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <button 
                   onClick={() => handleDelete(i)}
                   className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white hover:scale-110 hover:bg-red-500 transition-all shadow-lg"
                 >
                   <Trash2 size={20} />
                 </button>
              </div>

              {/* Mobile Always Visible Delete Button */}
              <button 
                   onClick={() => handleDelete(i)}
                   className="absolute top-1 right-1 w-7 h-7 bg-red-600/90 backdrop-blur rounded-full flex items-center justify-center text-white shadow-md md:hidden border border-white/20"
                 >
                   <X size={14} />
               </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default EditGallery;