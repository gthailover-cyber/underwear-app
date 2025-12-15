
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
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [coverImage, setCoverImage] = useState<string>('https://picsum.photos/400/700?random=' + Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [streamMethod, setStreamMethod] = useState<StreamMethod>('livekit');

  const t = TRANSLATIONS[language];

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

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
    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const youtubeId = streamMethod === 'youtube' ? extractYoutubeId(youtubeUrl) : undefined;

      const newStreamer: Streamer = {
        id: `live-${Date.now()}`,
        name: 'Me (Host)', // In real app, get from user profile
        title: title || 'Live Sale! 🔥',
        viewerCount: 0,
        coverImage: coverImage,
        youtubeId: youtubeId || undefined, // Use extracted ID
        useLiveKit: streamMethod === 'livekit', // NEW: Flag to use LiveKit
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

          {/* Streaming Method Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Streaming Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStreamMethod('livekit')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${streamMethod === 'livekit'
                    ? 'bg-red-500/10 border-red-500 text-red-500'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                  }`}
              >
                <div className="relative">
                  <Video size={24} />
                  {streamMethod === 'livekit' && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-medium text-sm">LiveKit (WebRTC)</span>
                  <span className="text-[10px] opacity-70">Recommended • Low Latency</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStreamMethod('youtube')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${streamMethod === 'youtube'
                    ? 'bg-red-500/10 border-red-500 text-red-500'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                  }`}
              >
                <Youtube size={24} />
                <div className="flex flex-col items-center">
                  <span className="font-medium text-sm">YouTube Live</span>
                  <span className="text-[10px] opacity-70">Legacy • High Viewer Count</span>
                </div>
              </button>
            </div>
          </div>

          {/* YouTube URL Input (Conditional) */}
          {streamMethod === 'youtube' && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <LinkIcon size={14} />
                YouTube Live URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/live/..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 pl-10 text-white focus:border-red-600 focus:outline-none placeholder-gray-600"
                  required={streamMethod === 'youtube'}
                />
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              </div>
              <p className="text-xs text-gray-500">
                Paste the URL of your scheduled or active YouTube live stream.
              </p>
            </div>
          )}

          {streamMethod === 'livekit' && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-200 animate-fade-in">
              <p className="font-semibold mb-1">Ready to go live directly?</p>
              <p className="opacity-80">This will use your device's camera and microphone for a real-time interactive stream.</p>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading || (streamMethod === 'youtube' && !youtubeUrl)}
            className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
