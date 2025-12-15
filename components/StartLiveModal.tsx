
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const youtubeId = streamMethod === 'youtube' ? extractYoutubeId(youtubeUrl) : undefined;

      const youtubeId = extractYoutubeId(youtubeUrl);

      const newStreamer: Streamer = {
        id: `live-${Date.now()}`,
        name: 'Me (Host)', // In real app, get from user profile
        title: title || 'Live Sale! 🔥',
        viewerCount: 0,
        coverImage: coverImage,
        youtubeId: youtubeId, // Use extracted ID
        useLiveKit: streamMethod === 'livekit', // NEW: Flag to use LiveKit
        youtubeId: youtubeId || undefined, // Use extracted ID
        itemCount: 0, // Will be populated in App.tsx logic if products selected
        products: [] // Will be populated in App.tsx logic if products selected
      };

      onStart(newStreamer);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden animate-fade-in">


        <div className="relative w-full max-w-md bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden animate-fade-in">

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
              <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="What are you selling today?"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none placeholder-gray-600"
                      required
                    />
                  </div>

                  {/* Stream Method Selection */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Streaming Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setStreamMethod('livekit')}
                        className={`p-3 rounded-xl border-2 transition-all ${streamMethod === 'livekit'
                          ? 'border-red-600 bg-red-600/10'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                          }`}
                      >
                        <Radio size={20} className={`mx-auto mb-1 ${streamMethod === 'livekit' ? 'text-red-500' : 'text-gray-400'}`} />
                        <div className="text-xs font-bold text-white">LiveKit</div>
                        <div className="text-[9px] text-gray-400">Recommended</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStreamMethod('youtube')}
                        className={`p-3 rounded-xl border-2 transition-all ${streamMethod === 'youtube'
                          ? 'border-red-600 bg-red-600/10'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                          }`}
                      >
                        <Youtube size={20} className={`mx-auto mb-1 ${streamMethod === 'youtube' ? 'text-red-500' : 'text-gray-400'}`} />
                        <div className="text-xs font-bold text-white">YouTube</div>
                        <div className="text-[9px] text-gray-400">Alternative</div>
                      </button>
                    </div>
                  </div>

                  {/* YouTube URL Input (only show if YouTube is selected) */}
                  {streamMethod === 'youtube' && (
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center justify-between">
                        <span>YouTube Link</span>
                        <span className="text-[10px] text-red-500 flex items-center gap-1"><Youtube size={10} /> YouTube Only</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          placeholder="Paste YouTube Link (e.g. https://youtu.be/...)"
                          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 pl-10 text-white focus:border-red-600 focus:outline-none placeholder-gray-600"
                          required={streamMethod === 'youtube'}
                        />
                        <LinkIcon size={16} className="absolute left-3.5 top-3.5 text-gray-500" />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                        * Tip: Go Live on YouTube first, then copy the share link and paste it here.
                      </p>
                    </div>
                  )}

                  {/* LiveKit Info (only show if LiveKit is selected) */}
                  {streamMethod === 'livekit' && (
                    <div className="bg-gradient-to-br from-red-900/20 to-purple-900/20 border border-red-500/30 rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <Radio size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="text-[11px] text-gray-300 leading-relaxed">
                          <p className="font-bold text-white mb-1">🚀 Professional Live Streaming</p>
                          <p>• Ultra-low latency WebRTC streaming</p>
                          <p>• HD quality with adaptive bitrate</p>
                          <p>• Works directly in browser</p>
                          <p className="mt-2 text-yellow-400">Click "START LIVE NOW" to begin!</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Button */}
                <button
                  <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center justify-between">
                  <span>YouTube Link</span>
                  <span className="text-[10px] text-red-500 flex items-center gap-1"><Youtube size={10} /> YouTube Only</span>
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

