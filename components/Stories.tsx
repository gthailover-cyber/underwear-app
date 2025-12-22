import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, ChevronLeft, ChevronRight, Camera, Clock, Eye, Heart } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import UserBadge from './UserBadge';
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
        role: any;
    };
    story_likes: { user_id: string }[];
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
    const [pendingStory, setPendingStory] = useState<{ file: File; preview: string; type: 'image' | 'video' } | null>(null);
    const [caption, setCaption] = useState('');
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
                .select('*, profiles:user_id(username, avatar, role), story_likes(user_id)')
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

        // Subscribe to story changes
        const channel = supabase
            .channel('public:stories_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => {
                fetchStories();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'story_likes' }, () => {
                fetchStories();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setPendingStory({
                file,
                preview: reader.result as string,
                type: file.type.startsWith('video') ? 'video' : 'image'
            });
        };
        reader.readAsDataURL(file);
    };

    const handlePostStory = async () => {
        if (!pendingStory) return;

        setIsUploading(true);
        try {
            const file = pendingStory.file;
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
                    media_type: pendingStory.type,
                    content: caption,
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                });

            if (insertError) throw insertError;

            alert(language === 'th' ? 'สร้างสตอรี่สำเร็จ!' : 'Story posted successfully!');
            setPendingStory(null);
            setCaption('');
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

    const handleLike = async (storyId: string, ownerId: string) => {
        if (!userProfile.id) return;

        const story = viewingStories[currentStoryIndex];
        const hasLiked = story.story_likes?.some(l => l.user_id === userProfile.id);

        // 1. Optimistic Update
        setViewingStories(prev => prev.map(s => {
            if (s.id === storyId) {
                const updatedLikes = hasLiked
                    ? (s.story_likes || []).filter(l => l.user_id !== userProfile.id)
                    : [...(s.story_likes || []), { user_id: userProfile.id }];
                return { ...s, story_likes: updatedLikes };
            }
            return s;
        }));

        try {
            if (hasLiked) {
                await supabase
                    .from('story_likes')
                    .delete()
                    .eq('story_id', storyId)
                    .eq('user_id', userProfile.id);
            } else {
                const { error: likeError } = await supabase
                    .from('story_likes')
                    .insert({ story_id: storyId, user_id: userProfile.id });

                if (likeError) throw likeError;
                // หมายเหตุ: ไม่ต้อง INSERT notifications ที่นี่ เพราะ SQL Trigger จะจัดการให้แล้ว
            }
            // 2. Sync with background data (updates the main stories list too)
            fetchStories();
        } catch (err) {
            console.error('Error toggling like:', err);
            // Optional: Revert on error if needed
        }
    };

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
                            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                                <img
                                    src={userProfile.avatar}
                                    className="w-12 h-12 rounded-full border-2 border-red-600 object-cover mb-2"
                                    alt=""
                                />
                                <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full w-6 h-6 flex items-center justify-center border-2 border-black">
                                    <Plus size={16} className="text-white" />
                                </div>
                                <UserBadge
                                    role={userProfile.role}
                                    size="sm"
                                    className="absolute -top-1 -right-1"
                                />
                                <span className="text-xs text-white font-bold mt-2">Add Story</span>
                            </div>
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
                            <div className="relative">
                                <img
                                    src={item.user?.avatar}
                                    className="w-8 h-8 rounded-lg border-2 border-black object-cover"
                                    alt={item.user?.username}
                                />
                                <UserBadge
                                    role={item.user?.role}
                                    size="sm"
                                    className="absolute -top-1 -right-1"
                                />
                            </div>
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

            {/* Story Viewer Overlay (Portal to Body) */}
            {isViewing && viewingStories.length > 0 && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center animate-fade-in">
                    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col">
                        {/* Progress Bars */}
                        <div className="absolute top-4 left-4 right-4 z-[10001] flex gap-1">
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
                        <div className="absolute top-8 left-4 right-4 z-[10001] flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent p-2 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <img
                                        src={viewingStories[currentStoryIndex].profiles.avatar}
                                        className="w-10 h-10 rounded-full border border-white/20 object-cover"
                                        alt=""
                                    />
                                    <UserBadge
                                        role={viewingStories[currentStoryIndex].profiles.role}
                                        size="sm"
                                        className="absolute -top-1 -right-1"
                                    />
                                </div>
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
                        <div className="w-full h-full flex flex-col items-center justify-center bg-black relative">
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

                            {/* Caption Overlay */}
                            {viewingStories[currentStoryIndex].content && (
                                <div className="absolute bottom-20 left-4 right-4 z-[10003] text-center">
                                    <p className="inline-block px-4 py-2 bg-black/50 backdrop-blur-md rounded-xl text-white font-bold shadow-lg">
                                        {viewingStories[currentStoryIndex].content}
                                    </p>
                                </div>
                            )}

                            {/* Like Button */}
                            <div className="absolute bottom-8 right-4 z-[10003] flex flex-col items-center gap-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleLike(viewingStories[currentStoryIndex].id, viewingStories[currentStoryIndex].user_id);
                                    }}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-75 ${viewingStories[currentStoryIndex].story_likes?.some(l => l.user_id === userProfile.id)
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/40'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    <Heart size={28} fill={viewingStories[currentStoryIndex].story_likes?.some(l => l.user_id === userProfile.id) ? "currentColor" : "none"} />
                                </button>
                                <span className="text-white text-xs font-bold drop-shadow-md">
                                    {viewingStories[currentStoryIndex].story_likes?.length || 0}
                                </span>
                            </div>
                        </div>

                        {/* Navigation Areas */}
                        <div className="absolute inset-y-0 left-0 w-1/3 z-[10002]" onClick={() => currentStoryIndex > 0 && setCurrentStoryIndex(prev => prev - 1)}></div>
                        <div className="absolute inset-y-0 right-0 w-2/3 z-[10002]" onClick={() => {
                            if (currentStoryIndex < viewingStories.length - 1) {
                                setCurrentStoryIndex(prev => prev + 1);
                            } else {
                                setIsViewing(false);
                            }
                        }}></div>
                    </div>
                </div>,
                document.body
            )}
            {/* Create Story Modal (Portal to Body) */}
            {pendingStory && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-2 sm:p-4 animate-fade-in backdrop-blur-sm">
                    <div className="relative w-full max-w-md h-[90vh] sm:h-auto sm:aspect-[9/16] bg-gray-950 rounded-3xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col">
                        {/* Preview Section */}
                        <div className="flex-1 bg-black relative min-h-0">
                            {pendingStory.type === 'video' ? (
                                <video src={pendingStory.preview} autoPlay muted loop className="w-full h-full object-contain" />
                            ) : (
                                <img src={pendingStory.preview} className="w-full h-full object-contain" alt="" />
                            )}

                            <button
                                onClick={() => setPendingStory(null)}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors z-20"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Caption & Actions Section */}
                        <div className="p-4 sm:p-6 bg-gray-900 border-t border-gray-800">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block ml-1">Add Caption</label>
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Write a headline for your story..."
                                className="w-full bg-black/40 border border-gray-700 rounded-2xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition-colors resize-none h-20 mb-4 text-sm"
                                autoFocus
                            />
                            <button
                                onClick={handlePostStory}
                                disabled={isUploading}
                                className="w-full py-4 bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 transition-all rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 mb-2"
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Posting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Camera size={20} />
                                        <span>Post Story Now</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Stories;
