
import React, { useState, useEffect } from 'react';
import { MapPin, ArrowLeft, MessageCircle, UserPlus, Grid, Share2, MoreVertical, BicepsFlexed, Crown, User, Calendar, CheckCircle, X, Video, Package } from 'lucide-react';
import { Person, Language, UserProfile } from '../types';
import { TRANSLATIONS, DEFAULT_IMAGES } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface UserProfileDetailProps {
    language: Language;
    person: Person;
    onBack: () => void;
    onChat: () => void;
}

const UserProfileDetail: React.FC<UserProfileDetailProps> = ({ language, person, onBack, onChat }) => {
    const t = TRANSLATIONS[language];

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            // Try to fetch full profile details if available in DB
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', person.id)
                .single();

            if (data) {
                setProfile({
                    username: data.username,
                    avatar: data.avatar || DEFAULT_IMAGES.AVATAR,
                    coverImage: data.cover_image || DEFAULT_IMAGES.COVER,
                    role: data.role,
                    age: data.age || 0,
                    height: data.height || 0,
                    weight: data.weight || 0,
                    location: data.location || 'Unknown',
                    bio: data.bio || '',
                    favorites: data.favorites || [],
                    gallery: data.gallery || [],
                    followers: data.followers || 0,
                    following: data.following || 0,
                    rate_event_live: data.rate_event_live,
                    rate_product_presentation: data.rate_product_presentation,
                    rate_onsite: data.rate_onsite,
                });
            } else {
                // Fallback if not found in DB (e.g. newly created via mock array previously)
                // Since we removed mocks, this shouldn't happen often if data integrity is good.
                // But we display what we have from 'person' prop
                setProfile({
                    username: person.username,
                    avatar: person.avatar,
                    coverImage: DEFAULT_IMAGES.COVER,
                    role: person.role || 'supporter',
                    age: 0,
                    height: 0,
                    weight: 0,
                    location: '',
                    bio: '',
                    favorites: [],
                    gallery: [],
                    followers: person.followers || 0,
                    following: 0,
                });
            }
            setLoading(false);
        };

        fetchProfile();
    }, [person]);

    if (loading || !profile) return <div className="h-screen bg-black flex items-center justify-center text-white"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

    // Helper to render stats
    const renderPhysicalStats = (bgColor: string = 'bg-gray-900') => (
        <div className={`${bgColor} border-y border-gray-800 py-4 px-6 mb-4`}>
            <div className="flex justify-between items-center max-w-sm mx-auto">
                <div className="text-center">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">{t.height}</span>
                    <span className="text-xl font-bold text-white font-athletic">{profile.height > 0 ? profile.height : '-'} <span className="text-xs text-gray-400 font-sans">{t.cm}</span></span>
                </div>
                <div className="w-px h-8 bg-gray-800"></div>
                <div className="text-center">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">{t.weight}</span>
                    <span className="text-xl font-bold text-white font-athletic">{profile.weight > 0 ? profile.weight : '-'} <span className="text-xs text-gray-400 font-sans">{t.kg}</span></span>
                </div>
                <div className="w-px h-8 bg-gray-800"></div>
                <div className="text-center">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">{t.age}</span>
                    <span className="text-xl font-bold text-white font-athletic">{profile.age > 0 ? profile.age : '-'} <span className="text-xs text-gray-400 font-sans">{t.years}</span></span>
                </div>
            </div>
        </div>
    );

    // --- MODEL VIEW ---
    if (profile.role === 'model') {
        return (
            <div className="h-full overflow-y-auto no-scrollbar pb-0 animate-slide-in bg-black relative z-30">
                {/* Nav */}
                <div className="fixed top-0 left-0 right-0 z-50 px-4 py-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                    <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors pointer-events-auto border border-white/10">
                        <ArrowLeft size={22} />
                    </button>
                    <div className="flex gap-3 pointer-events-auto">
                        <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"><Share2 size={20} /></button>
                        <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"><MoreVertical size={20} /></button>
                    </div>
                </div>

                {/* Hero */}
                <div className="relative h-[80vh] w-full">
                    <img src={profile.coverImage} className="w-full h-full object-cover" alt="Model Cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90"></div>
                    <div className="absolute bottom-0 left-0 right-0 px-6 pb-32 pt-6 flex flex-col items-start z-10">
                        <div className="flex items-center gap-2 mb-2 animate-fade-in">
                            <div className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-yellow-500/20">
                                <BicepsFlexed size={10} strokeWidth={3} /> Official Model
                            </div>
                            <div className="bg-white/10 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/20 flex items-center gap-1">
                                <CheckCircle size={10} className="text-blue-400" /> Verified
                            </div>
                            {person.isOnline && (
                                <div className="bg-green-600/20 backdrop-blur-md text-green-400 border border-green-500/50 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Online
                                </div>
                            )}
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black font-athletic text-white leading-none tracking-wide uppercase drop-shadow-2xl mb-1">{profile.username}</h1>
                        <div className="flex items-center gap-1.5 text-gray-300 text-sm font-medium drop-shadow-md mb-4">
                            <MapPin size={16} className="text-red-500" /> {profile.location}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="bg-black relative z-20 -mt-6 rounded-t-3xl border-t border-gray-800/50 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
                    <div className="flex justify-center -mt-8 mb-6 gap-4 px-6 relative z-30">
                        <button className="flex-1 bg-red-600 hover:bg-red-700 text-white h-14 rounded-2xl font-bold text-lg shadow-lg shadow-red-900/50 flex items-center justify-center gap-2 transition-all active:scale-95"><UserPlus size={20} /> {t.follow}</button>
                        <button onClick={onChat} className="flex-1 bg-white hover:bg-gray-200 text-black h-14 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"><MessageCircle size={20} /> Chat</button>
                    </div>

                    {/* Physical Stats for Model */}
                    {renderPhysicalStats('bg-black border-gray-900')}

                    {/* Social Stats */}
                    <div className="flex items-center justify-around px-6 mb-8">
                        <div className="text-center"><span className="text-2xl font-bold text-white font-athletic">{profile.followers.toLocaleString()}</span><span className="text-xs text-gray-500 uppercase tracking-wider block">{t.followers}</span></div>
                        <div className="w-px h-8 bg-gray-800"></div>
                        <div className="text-center"><span className="text-2xl font-bold text-white font-athletic">{profile.following.toLocaleString()}</span><span className="text-xs text-gray-500 uppercase tracking-wider block">{t.following}</span></div>
                    </div>

                    {/* Model Rates Section */}
                    {(profile.rate_event_live || profile.rate_product_presentation || profile.rate_onsite) ? (
                        <div className="px-6 mb-10">
                            <h3 className="text-white font-bold text-lg font-athletic tracking-wide mb-4 flex items-center gap-2">
                                <Crown size={18} className="text-yellow-500" /> SERVICE RATES
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {profile.rate_event_live !== undefined && profile.rate_event_live > 0 && (
                                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 flex items-center justify-between hover:bg-gray-800/80 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-red-900/20 flex items-center justify-center text-red-500 border border-red-500/20">
                                                <Video size={18} />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-sm tracking-tight">{t.eventLiveRate}</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Online Streaming / Host</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-yellow-400 font-black text-xl font-athletic">{profile.rate_event_live.toLocaleString()}</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{t.perHour}</p>
                                        </div>
                                    </div>
                                )}

                                {profile.rate_product_presentation !== undefined && profile.rate_product_presentation > 0 && (
                                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 flex items-center justify-between hover:bg-gray-800/80 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center text-blue-500 border border-blue-500/20">
                                                <Package size={18} />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-sm tracking-tight">{t.productPresentationRate}</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Product Review / Unboxing</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-blue-400 font-black text-xl font-athletic">{profile.rate_product_presentation.toLocaleString()}</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{t.perHour}</p>
                                        </div>
                                    </div>
                                )}

                                {profile.rate_onsite !== undefined && profile.rate_onsite > 0 && (
                                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 flex items-center justify-between hover:bg-gray-800/80 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-yellow-900/20 flex items-center justify-center text-yellow-500 border border-yellow-500/20">
                                                <MapPin size={18} />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-sm tracking-tight">{t.onsiteEventRate}</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">On-site Appearance / Event</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-yellow-500 font-black text-xl font-athletic">{profile.rate_onsite.toLocaleString()}</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{t.perHour}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {/* Gallery */}
                    <div className="pb-24">
                        <div className="flex items-center justify-between px-6 mb-4">
                            <h3 className="text-white font-bold text-xl font-athletic tracking-wide flex items-center gap-2">PORTFOLIO <span className="text-xs font-sans font-normal text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full">{profile.gallery.length}</span></h3>
                        </div>
                        <div className="grid grid-cols-2 gap-1 px-1">
                            {profile.gallery.map((img, i) => (
                                <div key={i} onClick={() => setLightboxIndex(i)} className={`relative group overflow-hidden bg-gray-900 cursor-pointer ${i % 3 === 0 ? 'col-span-2 aspect-[16/10]' : 'col-span-1 aspect-[3/4]'}`}>
                                    <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {lightboxIndex !== null && (
                    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in" onClick={() => setLightboxIndex(null)}>
                        <img src={profile.gallery[lightboxIndex]} className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg shadow-2xl" />
                        <button onClick={() => setLightboxIndex(null)} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white"><X size={24} /></button>
                    </div>
                )}
            </div>
        );
    }

    // --- ORGANIZER & SUPPORTER VIEWS (Simpler) ---
    return (
        <div className="h-full overflow-y-auto no-scrollbar pb-24 animate-slide-in bg-black relative z-30">
            <div className="fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between pointer-events-none">
                <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 pointer-events-auto border border-white/10"><ArrowLeft size={22} /></button>
            </div>

            <div className="relative h-44 w-full bg-gray-800 overflow-hidden">
                <img src={profile.coverImage} className="w-full h-full object-cover opacity-70" alt="Cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
            </div>

            <div className="relative px-4 -mt-16 mb-4 flex flex-col items-center">
                <div className="relative">
                    <div className="w-28 h-28 rounded-full border-4 border-black bg-gray-800 overflow-hidden shadow-xl">
                        <img src={profile.avatar} className="w-full h-full object-cover" alt="Profile" />
                    </div>
                    {person.isOnline && (
                        <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-4 border-black"></div>
                    )}
                </div>

                <h1 className="text-xl font-bold text-white mt-3">{profile.username}</h1>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1">
                    <User size={12} /> <span>{t.roles.supporter}</span>
                    <span className="text-gray-600">•</span>
                    <span>{profile.location}</span>
                </div>

                <div className="flex gap-3 mt-5">
                    <button className="px-6 py-2 bg-red-600 rounded-full text-white font-bold flex items-center gap-2 hover:bg-red-700 shadow-lg shadow-red-900/40 active:scale-95 transition-all text-sm">
                        <UserPlus size={16} /> {t.follow}
                    </button>
                    <button onClick={onChat} className="px-6 py-2 bg-gray-800 border border-gray-700 rounded-full text-white font-bold flex items-center gap-2 hover:bg-gray-700 active:scale-95 transition-all text-sm">
                        <MessageCircle size={16} /> Chat
                    </button>
                </div>
            </div>

            <div className="flex justify-center gap-10 mb-8 border-b border-gray-800 pb-6 mx-8">
                <div className="text-center">
                    <span className="block font-bold text-lg text-white">{profile.following.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Following</span>
                </div>
                <div className="w-px bg-gray-800"></div>
                <div className="text-center">
                    <span className="block font-bold text-lg text-white">{profile.followers.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Followers</span>
                </div>
            </div>

            {renderPhysicalStats('bg-gray-900')}

            <div className="px-6 text-center">
                <p className="text-gray-300 text-sm italic mb-6">"{profile.bio}"</p>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-widest">{t.favorites}</h3>
                <div className="flex flex-wrap justify-center gap-2">
                    {profile.favorites.map((fav, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-900 border border-gray-800 rounded-full text-xs text-gray-300">
                            {fav}
                        </span>
                    ))}
                </div>
            </div>

            {/* Gallery Section */}
            <div className="mt-8 border-t border-gray-800 pt-6">
                <h3 className="px-6 text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <Grid size={18} className="text-gray-400" /> Gallery
                </h3>
                <div className="grid grid-cols-3 gap-0.5 px-0.5">
                    {profile.gallery.map((img, i) => (
                        <div key={i} onClick={() => setLightboxIndex(i)} className="aspect-square bg-gray-900 cursor-pointer overflow-hidden relative group">
                            <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Gallery" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in" onClick={() => setLightboxIndex(null)}>
                    <img src={profile.gallery[lightboxIndex]} className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg shadow-2xl" />
                    <button onClick={() => setLightboxIndex(null)} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white"><X size={24} /></button>
                </div>
            )}
        </div>
    );
};

export default UserProfileDetail;
