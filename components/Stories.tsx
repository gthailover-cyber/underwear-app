
import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Camera, Clock, Eye } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface Story {
    id: string;
    user_id: string;
    media_url: string;
    media_type: string;
    content: string | null;
    created_at: string;
    expires_at: string;
    profiles: {
        username: string;
        avatar: string;
    };
}

interface StoriesProps {
    userProfile: UserProfile;
    language: Language;
}

const Stories: React.FC<StoriesProps> = ({ userProfile, language }) => {
    const t = TRANSLATIONS[language];
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [isViewing, setIsViewing] = useState(false);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Group stories by user
    const groupedStories = stories.reduce((acc: any, story) => {
        if (!acc[story.user_id]) {
            acc[story.user_id] = {
                user: story.profiles,
                userId: story.user_id,
                items: []
            };
        }
        acc[story.user_id].items.push(story);
        return acc;
    }, {});

    const storyUsers = Object.values(groupedStories);

    const fetchStories = async () => {
        try {
            const { data, error } = await supabase
                .from('stories')
                .select('*, profiles:user_id(username, avatar)')
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStories(data || []);
        } catch (err) {
            console.error('Error fetching stories:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStories();

        // Subscribe to new stories
        const channel = supabase
            .channel('public:stories')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories' }, () => {
                fetchStories();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userProfile.id}/${Math.random()}.${fileExt}`;
            const filePath = `stories/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('gunderwear-bucket')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('gunderwear-bucket')
                .getPublicUrl(filePath);

            const { error: insertError } = await supabase
                .from('stories')
                .insert({
                    user_id: userProfile.id,
                    media_url: publicUrl,
                    media_type: file.type.startsWith('video') ? 'video' : 'image',
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                });

            if (insertError) throw insertError;

            alert(language === 'th' ? 'สร้างสตอรี่สำเร็จ!' : 'Story posted successfully!');
            fetchStories();
        } catch (err) {
            console.error('Error uploading story:', err);
            alert('Failed to post story.');
        } finally {
            setIsUploading(false);
        }
    };

    const openStory = (userId: string) => {
        const userStories = groupedStories[userId].items;
        setViewingStories(userStories);
        setCurrentStoryIndex(0);
        setIsViewing(true);
    };

    const [viewingStories, setViewingStories] = useState<Story[]>([]);
    const progressTimer = useRef<any>(null);

    useEffect(() => {
        if (isViewing && viewingStories.length > 0) {
            if (progressTimer.current) clearTimeout(progressTimer.current);

            progressTimer.current = setTimeout(() => {
                if (currentStoryIndex < viewingStories.length - 1) {
                    setCurrentStoryIndex(prev => prev + 1);
                } else {
                    setIsViewing(false);
                }
            }, 5000); // 5 seconds per story
        }
        return () => {
            if (progressTimer.current) clearTimeout(progressTimer.current);
        };
    }, [isViewing, currentStoryIndex, viewingStories]);

    return (
        <div className="w-full bg-black/40 backdrop-blur-md py-4 border-b border-gray-800/50 mb-2 overflow-hidden">
            <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar">
                {/* Create Story Button */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-28 aspect-[9/16] rounded-xl bg-gray-900 border-2 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-gray-800 transition-all group relative overflow-hidden shadow-lg"
                    >
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-[10px] text-gray-500 font-bold">Uploading...</span>
                            </div>
                        ) : (
                            <>
                                <img
                                    src={userProfile.avatar}
                                    className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale"
                                    alt=""
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform mb-2">
                                        <Plus size={24} />
                                    </div>
                                    <span className="text-xs text-white font-bold">Add Story</span>
                                </div>
                            </>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                        />
                    </div>
                </div>

                {/* Story List */}
                {storyUsers.map((item: any) => (
                    <div
                        key={item.userId}
                        onClick={() => openStory(item.userId)}
                        className="flex-shrink-0 w-28 aspect-[9/16] relative rounded-xl overflow-hidden cursor-pointer group border border-gray-800 shadow-lg active:scale-95 transition-all"
                    >
                        {/* Background Media Preview */}
                        <img
                            src={item.items[0].media_url}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            alt=""
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>

                        {/* User Avatar Overlay (Top Left) */}
                        <div className="absolute top-2 left-2 p-[2px] rounded-xl bg-gradient-to-tr from-red-600 via-pink-600 to-orange-500 shadow-md">
                            <img
                                src={item.user?.avatar}
                                className="w-8 h-8 rounded-lg border-2 border-black object-cover"
                                alt={item.user?.username}
                            />
                        </div>

                        {/* Username Overlay (Bottom) */}
                        <div className="absolute bottom-2 left-2 right-2">
                            <span className="text-[10px] text-white font-bold truncate block drop-shadow-md">
                                {item.userId === userProfile.id ? 'Your Story' : item.user?.username}
                            </span>
                        </div>
                    </div>
                ))}

                {loading && !stories.length && (
                    <div className="flex gap-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-16 h-16 rounded-2xl bg-gray-900 animate-pulse border border-gray-800"></div>
                        ))}
                    </div>
                )}
            </div>

            {/* Story Viewer Overlay */}
            {isViewing && viewingStories.length > 0 && (
                <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
                    <div className="relative w-full max-w-lg h-full bg-black overflow-hidden">
                        {/* Progress Bars */}
                        <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
                            {viewingStories.map((_, idx) => (
                                <div key={idx} className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-white transition-all duration-[5000ms] ease-linear ${idx < currentStoryIndex ? 'w-full' : idx === currentStoryIndex ? 'w-full' : 'w-0'
                                            }`}
                                    ></div>
                                </div>
                            ))}
                        </div>

                        {/* Header */}
                        <div className="absolute top-8 left-4 right-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent p-2 rounded-xl">
                            <div className="flex items-center gap-3">
                                <img
                                    src={viewingStories[currentStoryIndex].profiles.avatar}
                                    className="w-10 h-10 rounded-full border border-white/20 object-cover"
                                    alt=""
                                />
                                <div>
                                    <h4 className="text-sm font-bold text-white shadow-sm">
                                        {viewingStories[currentStoryIndex].profiles.username}
                                    </h4>
                                    <p className="text-[10px] text-gray-300 flex items-center gap-1">
                                        <Clock size={10} /> {new Date(viewingStories[currentStoryIndex].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsViewing(false)}
                                className="w-10 h-10 flex items-center justify-center bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="w-full h-full flex items-center justify-center">
                            {viewingStories[currentStoryIndex].media_type === 'video' ? (
                                <video
                                    src={viewingStories[currentStoryIndex].media_url}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <img
                                    src={viewingStories[currentStoryIndex].media_url}
                                    className="w-full h-full object-contain"
                                    alt=""
                                />
                            )}
                        </div>

                        {/* Navigation Areas */}
                        <div className="absolute inset-y-0 left-0 w-1/3 z-30" onClick={() => currentStoryIndex > 0 && setCurrentStoryIndex(prev => prev - 1)}></div>
                        <div className="absolute inset-y-0 right-0 w-2/3 z-30" onClick={() => {
                            if (currentStoryIndex < viewingStories.length - 1) {
                                setCurrentStoryIndex(prev => prev + 1);
                            } else {
                                setIsViewing(false);
                            }
                        }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stories;
