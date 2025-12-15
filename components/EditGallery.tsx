
import React, { useState, useRef } from 'react';
import { X, Plus, Save, Trash2, ImagePlus } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface EditGalleryProps {
  language: Language;
  initialGallery: string[];
  onSave: (gallery: string[]) => void;
  onCancel: () => void;
}

const EditGallery: React.FC<EditGalleryProps> = ({ language, initialGallery, onSave, onCancel }) => {
  const t = TRANSLATIONS[language];
  const [gallery, setGallery] = useState<string[]>(initialGallery);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = (index: number) => {
    setGallery(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  // Utility to resize image
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
            }, 'image/jpeg', 0.85); // 85% quality for gallery
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
          // 1. Resize Image (Gallery typically needs decent quality, max width 1024px)
          const resizedBlob = await resizeImage(file, 1024);

          const fileExt = 'jpg';
          const fileName = `gallery/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          // 2. Upload to 'gunderwear-bucket'
          const { error: uploadError } = await supabase.storage
              .from('gunderwear-bucket')
              .upload(fileName, resizedBlob, {
                contentType: 'image/jpeg'
              });

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
              .from('gunderwear-bucket')
              .getPublicUrl(fileName);
          
          if (data.publicUrl) {
              setGallery(prev => [data.publicUrl, ...prev]);
          }
      } catch (error: any) {
          console.error('Error uploading gallery image:', error);
          alert(`Failed to upload image: ${error.message || 'Unknown error'}`);
      } finally {
          setIsUploading(false);
          // Reset input so same file can be selected again if needed
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
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
        
        {/* Hidden File Input */}
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
        />

        {/* Upload Button */}
        <button 
          onClick={handleAddClick}
          disabled={isUploading}
          className={`w-full h-24 mb-6 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-red-600 hover:bg-gray-900/50 transition-all gap-2 group ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
        >
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-red-600 transition-colors">
            {isUploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <ImagePlus size={16} className="group-hover:text-white" />
            )}
          </div>
          <span className="text-sm font-bold">{isUploading ? 'Uploading...' : t.uploadImage}</span>
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
