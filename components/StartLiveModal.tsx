
import React, { useState } from 'react';
import { X, Video, Youtube, Link as LinkIcon, ImagePlus, Radio } from 'lucide-react';
import { Language, Streamer, Product } from '../types';
import { TRANSLATIONS } from '../constants';

interface StartLiveModalProps {
  language: Language;
  onClose: () => void;
  onStart: (newStream: Streamer) => void;
}

type StreamMethod = 'livekit' | 'youtube';

const StartLiveModal: React.FC<StartLiveModalProps> = ({ language, onClose, onStart }) => {
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState<string>('https://picsum.photos/400/700?random=' + Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const t = TRANSLATIONS[language];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) return;
    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const newStreamer: Streamer = {
        id: `live-${Date.now()}`,
        name: 'Me (Host)', // In real app, get from user profile
        title: title || 'Live Sale! 🔥',
        viewerCount: 0,
        coverImage: coverImage,
        useLiveKit: true, // Always use LiveKit now
        itemCount: 0, // Will be populated in App.tsx logic if products selected
        products: [] // Will be populated in App.tsx logic if products selected
      };

      onStart(newStreamer);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-800 animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-red-500" />
            GO LIVE
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cover Image Preview */}
          <div className="relative group aspect-video rounded-xl overflow-hidden bg-gray-800 border-2 border-dashed border-gray-700 hover:border-red-500 transition-colors cursor-pointer">
            {coverImage ? (
              <>
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-medium flex items-center gap-2">
                    <ImagePlus size={20} /> Change Cover
                  </span>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <ImagePlus size={32} className="mb-2" />
                <span className="text-sm">Upload Cover Image</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleImageUpload}
            />
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you selling today?"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none placeholder-gray-600"
              required
            />
          </div>

          {/* LiveKit Reminder */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-200 animate-fade-in">
            <p className="font-semibold mb-1">Ready to go live directly?</p>
            <p className="opacity-80">This will use your device's camera and microphone for a real-time interactive stream.</p>
          </div>

          {/* Terms and Conditions */}
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl space-y-3">
            <p className="text-xs text-gray-400 leading-relaxed italic">
              "{t.liveTerms}"
            </p>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-700 bg-gray-900 text-red-600 focus:ring-red-600 focus:ring-offset-gray-900"
              />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                {t.iAgreeToLiveTerms}
              </span>
            </label>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading || !agreedToTerms}
            className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                START LIVE NOW
                <Video size={20} fill="currentColor" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StartLiveModal;
