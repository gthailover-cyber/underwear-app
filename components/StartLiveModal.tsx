
import React, { useState } from 'react';
import { X, Video, Youtube, Link as LinkIcon, ImagePlus } from 'lucide-react';
import { Language, Streamer, Product } from '../types';
import { TRANSLATIONS, MOCK_PRODUCTS } from '../constants';

interface StartLiveModalProps {
  language: Language;
  onClose: () => void;
  onStart: (newStream: Streamer) => void;
}

const StartLiveModal: React.FC<StartLiveModalProps> = ({ language, onClose, onStart }) => {
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [coverImage, setCoverImage] = useState<string>('https://picsum.photos/400/700?random=' + Date.now());
  const [isLoading, setIsLoading] = useState(false);

  const t = TRANSLATIONS[language];

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const youtubeId = extractYoutubeId(youtubeUrl);
      
      const newStreamer: Streamer = {
        id: `live-${Date.now()}`,
        name: 'Me (Host)', // In real app, get from user profile
        title: title || 'Live Sale! 🔥',
        viewerCount: 0,
        coverImage: coverImage,
        youtubeId: youtubeId || undefined, // Use extracted ID
        itemCount: 5,
        products: MOCK_PRODUCTS // Mock products for demo
      };

      onStart(newStreamer);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden animate-float">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-athletic text-white flex items-center gap-2">
            <Video className="text-red-600" />
            GO LIVE
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Cover Preview */}
          <div className="flex justify-center">
            <div className="relative w-32 h-48 bg-gray-800 rounded-xl overflow-hidden border-2 border-dashed border-gray-700 group cursor-pointer hover:border-red-500 transition-colors">
               <img src={coverImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-40" />
               <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-white">
                  <ImagePlus size={24} />
                  <span className="text-[10px] font-bold mt-1">Cover</span>
               </div>
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Live Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you selling today?"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none placeholder-gray-600"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center justify-between">
                <span>YouTube Link</span>
                <span className="text-[10px] text-red-500 flex items-center gap-1"><Youtube size={10}/> YouTube Only</span>
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="Paste YouTube Link (e.g. https://youtu.be/...)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 pl-10 text-white focus:border-red-600 focus:outline-none placeholder-gray-600"
                  required
                />
                <LinkIcon size={16} className="absolute left-3.5 top-3.5 text-gray-500" />
              </div>
              <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                * Tip: Go Live on YouTube first, then copy the share link and paste it here. This allows you to stream for <b>FREE</b> with unlimited viewers.
              </p>
            </div>
          </div>

          {/* Button */}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-900/50 hover:from-red-500 hover:to-red-400 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
               <>
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 Starting...
               </>
            ) : (
               'START LIVE NOW'
            )}
          </button>

        </form>

      </div>
    </div>
  );
};

export default StartLiveModal;
