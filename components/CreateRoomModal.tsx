
import React, { useState, useEffect } from 'react';
import { X, ImagePlus, Lock, Globe } from 'lucide-react';
import { Language, ChatRoom } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface CreateRoomModalProps {
  isOpen: boolean;
  language: Language;
  onClose: () => void;
  onCreate: (room: ChatRoom) => void;
  username: string;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, language, onClose, onCreate, username }) => {
  const t = TRANSLATIONS[language];
  const [roomName, setRoomName] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [image, setImage] = useState(`https://picsum.photos/300/300?random=${Date.now()}`);
  const [uploading, setUploading] = useState(false);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setRoomName('');
      setPrivacy('public');
      setImage(`https://picsum.photos/300/300?random=${Date.now()}`);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `room-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('room-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('room-images')
        .getPublicUrl(filePath);

      setImage(publicUrl);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Failed to upload image: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = () => {
    if (!roomName.trim()) return;

    const newRoom: ChatRoom = {
      id: `room-${Date.now()}`,
      name: roomName,
      image: image,
      type: privacy,
      hostId: 'me', // Will be replaced by actual user ID in onCreate handler
      hostName: username,
      members: 1,
      lastMessage: 'Room created',
      lastMessageTime: 'Just now'
    };

    onCreate(newRoom);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-center">
          <h3 className="font-bold text-white text-lg">{t.createRoom}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-800 p-1.5 rounded-full"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">

          {/* Image Upload */}
          <div className="flex justify-center">
            <label className="relative w-28 h-28 bg-gray-800 rounded-2xl overflow-hidden border-2 border-dashed border-gray-700 group cursor-pointer hover:border-red-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
              <img src={image} className="w-full h-full object-cover opacity-60 group-hover:opacity-40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-white">
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <ImagePlus size={24} />
                )}
              </div>
            </label>
          </div>

          {/* Name Input */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-2">{t.roomName}</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:border-red-600 focus:outline-none"
            />
          </div>

          {/* Privacy Toggle */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-2">{t.privacy}</label>
            <div className="flex gap-3">
              <button
                onClick={() => setPrivacy('public')}
                className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${privacy === 'public'
                  ? 'bg-red-900/20 border-red-600 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
              >
                <Globe size={24} className={privacy === 'public' ? 'text-red-500' : 'text-gray-500'} />
                <span className="text-sm font-bold">{t.public}</span>
              </button>
              <button
                onClick={() => setPrivacy('private')}
                className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${privacy === 'private'
                  ? 'bg-yellow-900/20 border-yellow-600 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
              >
                <Lock size={24} className={privacy === 'private' ? 'text-yellow-500' : 'text-gray-500'} />
                <span className="text-sm font-bold">{t.private}</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!roomName.trim()}
            className={`w-full font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 ${roomName.trim()
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/40'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
          >
            {t.create}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateRoomModal;
