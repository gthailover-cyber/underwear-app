
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Users, Ban, MicOff, MoreHorizontal, ShieldCheck, Search } from 'lucide-react';
import { Language, ChatRoom } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { useAlert } from '../context/AlertContext';

interface OrganizerToolsProps {
    language: Language;
    onBack: () => void;
    onCreateRoom: () => void;
    chatRooms: ChatRoom[];
    initialTab?: 'rooms' | 'members';
    currentUser: string;
    currentUserId?: string;
    pendingCounts?: { [roomId: string]: number };
    onUserClick?: (userId: string) => void;
}

const OrganizerTools: React.FC<OrganizerToolsProps> = ({
    language,
    onBack,
    onCreateRoom,
    chatRooms,
    initialTab = 'rooms',
    currentUser,
    currentUserId,
    pendingCounts = {},
    onUserClick
}) => {
    const t = TRANSLATIONS[language];
    const { showAlert } = useAlert();
    const [activeTab, setActiveTab] = useState<'rooms' | 'members'>(initialTab);
    const [searchTerm, setSearchTerm] = useState('');
    const [dbMembers, setDbMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [menuOpenRoomId, setMenuOpenRoomId] = useState<string | null>(null);
    const [roomToDelete, setRoomToDelete] = useState<ChatRoom | null>(null);
    const [filterRoomId, setFilterRoomId] = useState<string | null>(null);

    const isOnline = (lastSeenAt?: string) => {
        if (!lastSeenAt) return false;
        const lastSeen = new Date(lastSeenAt).getTime();
        const now = new Date().getTime();
        return (now - lastSeen) < 5 * 60 * 1000; // Online if seen in last 5 minutes
    };

    // Fetch real members from database
    const fetchMembers = async () => {
        if (!currentUserId) return;
        setLoading(true);
        try {
            // Updated query structure to correctly join and filter
            const { data, error } = await supabase
                .from('room_members')
                .select(`
                    id,
                    room_id,
                    user_id,
                    is_muted,
                    is_banned,
                    status,
                    profiles:user_id (id, username, avatar, last_seen_at),
                    chat_rooms:room_id (id, name, host_id)
                `);

            if (error) throw error;
            if (data) {
                // Filter where currentUserId is the host of the room
                const myMembers = data.filter((m: any) => m.chat_rooms?.host_id === currentUserId);
                setDbMembers(myMembers);
            }
        } catch (err: any) {
            console.error('[OrganizerTools] Error fetching members:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'members') {
            fetchMembers();
        }
    }, [activeTab, currentUserId]);

    // Handlers
    const handleMute = async (member: any) => {
        const newMuteStatus = !member.is_muted;
        try {
            const { error } = await supabase
                .from('room_members')
                .update({ is_muted: newMuteStatus })
                .eq('id', member.id);

            if (error) throw error;

            setDbMembers(prev => prev.map(m =>
                m.id === member.id ? { ...m, is_muted: newMuteStatus } : m
            ));

            showAlert({
                message: newMuteStatus ? 'User muted in this room' : 'User unmuted',
                type: 'success'
            });
        } catch (err: any) {
            console.error('[OrganizerTools] Mute error:', err);
            showAlert({ message: 'Failed to update mute status', type: 'error' });
        }
    };

    const handleBan = async (member: any) => {
        const newBanStatus = !member.is_banned;
        try {
            const { error } = await supabase
                .from('room_members')
                .update({ is_banned: newBanStatus })
                .eq('id', member.id);

            if (error) throw error;

            setDbMembers(prev => prev.map(m =>
                m.id === member.id ? { ...m, is_banned: newBanStatus } : m
            ));

            showAlert({
                message: newBanStatus ? 'User banned from this room' : 'User unbanned',
                type: 'success'
            });
        } catch (err: any) {
            console.error('[OrganizerTools] Ban error:', err);
            showAlert({ message: 'Failed to update ban status', type: 'error' });
        }
    };

    const handleApprove = async (member: any) => {
        try {
            const { error } = await supabase
                .from('room_members')
                .update({ status: 'approved' })
                .eq('id', member.id);

            if (error) throw error;

            setDbMembers(prev => prev.map(m =>
                m.id === member.id ? { ...m, status: 'approved' } : m
            ));

            showAlert({ message: 'User approved!', type: 'success' });
        } catch (err: any) {
            console.error('[OrganizerTools] Approval error:', err);
            showAlert({ message: 'Failed to approve user', type: 'error' });
        }
    };

    const handleReject = async (member: any) => {
        try {
            const { error } = await supabase
                .from('room_members')
                .delete()
                .eq('id', member.id);

            if (error) throw error;

            setDbMembers(prev => prev.filter(m => m.id !== member.id));

            showAlert({ message: 'Request rejected', type: 'info' });
        } catch (err: any) {
            console.error('[OrganizerTools] Rejection error:', err);
            showAlert({ message: 'Failed to reject user', type: 'error' });
        }
    };

    const handleDeleteRoom = async () => {
        if (!roomToDelete) return;

        try {
            const { error } = await supabase
                .from('chat_rooms')
                .delete()
                .eq('id', roomToDelete.id);

            if (error) throw error;

            showAlert({ message: 'Room deleted successfully', type: 'success' });
            setRoomToDelete(null);

            // To refresh room list, we rely on App.tsx realtime or re-fetch
            // But since this is a local prop, host might need to re-open tools
            // or we could add a refresh callback. For now, closing modal is fine.
        } catch (err: any) {
            console.error('[OrganizerTools] Delete room error:', err);
            showAlert({ message: 'Failed to delete room', type: 'error' });
        }
    };

    // Filter my rooms (where host_id is currentUserId)
    const myRooms = chatRooms.filter(r => r.hostId === currentUserId);

    const filteredRooms = myRooms.filter(room =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredMembers = dbMembers.filter(m =>
        (m.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.chat_rooms?.name?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        m.status === 'approved' &&
        (!filterRoomId || m.room_id === filterRoomId)
    );

    const pendingRequests = dbMembers.filter(m =>
        m.status === 'pending' &&
        (!filterRoomId || m.room_id === filterRoomId)
    );

    return (
        <div className="pb-24 animate-fade-in min-h-screen bg-black flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 sticky top-0 bg-black/90 backdrop-blur z-30 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700"
                    >
                        <ArrowLeft size={20} className="text-white" />
                    </button>
                    <h2 className="text-xl font-athletic tracking-wide text-white flex items-center gap-2">
                        <ShieldCheck size={24} className="text-yellow-500" />
                        {t.organizerTools}
                    </h2>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-4 py-3">
                <div className="flex bg-gray-900 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('rooms')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'rooms' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        {t.roomList}
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'members' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        {t.manageMembers}
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 mb-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder={t.searchMessages}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-gray-700"
                    />
                    <Search size={16} className="absolute left-3.5 top-3.5 text-gray-500" />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-20">
                {activeTab === 'rooms' ? (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400 text-sm">{t.activeRooms} ({myRooms.length})</span>
                            <button
                                onClick={onCreateRoom}
                                className="text-red-500 text-xs font-bold flex items-center gap-1 hover:text-red-400"
                            >
                                <Plus size={14} /> {t.createRoom}
                            </button>
                        </div>

                        {filteredRooms.map(room => (
                            <div key={room.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex gap-3 items-center group relative">
                                <img src={room.image} className="w-12 h-12 rounded-lg object-cover bg-gray-800" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-white font-bold text-sm truncate">{room.name}</h3>
                                        {pendingCounts[room.id] > 0 && (
                                            <div className="bg-red-600 text-white text-[10px] font-black h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-red-900/50">
                                                {pendingCounts[room.id]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Users size={12} /> {room.members}
                                        </span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${room.type === 'private' ? 'border-yellow-900 text-yellow-500' : 'border-blue-900 text-blue-500'
                                            }`}>
                                            {room.type}
                                        </span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpenRoomId(menuOpenRoomId === room.id ? null : room.id);
                                        }}
                                        className="p-2 text-gray-500 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
                                    >
                                        <MoreHorizontal size={18} />
                                    </button>

                                    {/* Action Menu */}
                                    {menuOpenRoomId === room.id && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setMenuOpenRoomId(null)}
                                            ></div>
                                            <div className="absolute right-0 top-full mt-1 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-up">
                                                {room.type === 'private' && (
                                                    <button
                                                        onClick={() => {
                                                            setFilterRoomId(room.id);
                                                            setActiveTab('members');
                                                            setMenuOpenRoomId(null);
                                                        }}
                                                        className="w-full px-4 py-3 text-left text-sm text-white hover:bg-gray-800 transition-colors flex items-center gap-2 border-b border-gray-800"
                                                    >
                                                        <Users size={16} className="text-yellow-500" />
                                                        {t.approveRequests}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setRoomToDelete(room);
                                                        setMenuOpenRoomId(null);
                                                    }}
                                                    className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                                >
                                                    <Ban size={16} />
                                                    {t.deleteRoom}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Member Filter Breadcrumb */}
                        {filterRoomId && (
                            <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-2 animate-fade-in">
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-yellow-500" />
                                    <span className="text-yellow-500 text-sm font-bold">
                                        Filtering: {myRooms.find(r => r.id === filterRoomId)?.name}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setFilterRoomId(null)}
                                    className="text-[10px] uppercase font-black text-yellow-500 hover:text-white"
                                >
                                    Show All
                                </button>
                            </div>
                        )}

                        {/* Pending Requests Section */}
                        {pendingRequests.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-white font-bold text-sm tracking-tight uppercase">Pending Requests ({pendingRequests.length})</span>
                                </div>
                                {pendingRequests.map(member => (
                                    <div key={member.id} className="bg-gray-900 border-2 border-yellow-500/20 rounded-2xl p-4 flex gap-4 items-center animate-fade-in">
                                        <button
                                            onClick={() => onUserClick?.(member.profiles?.id)}
                                            className="active:scale-95 transition-transform"
                                        >
                                            <img src={member.profiles?.avatar} className="w-12 h-12 rounded-full object-cover border border-gray-700" alt="" />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-bold text-sm truncate">{member.profiles?.username}</h3>
                                            <span className="text-[10px] text-yellow-500 font-bold block uppercase tracking-wider">Wants to join: {member.chat_rooms?.name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleReject(member)}
                                                className="px-3 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-colors text-xs font-bold"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleApprove(member)}
                                                className="px-4 py-2 bg-white text-black hover:bg-yellow-400 rounded-xl transition-colors text-xs font-black shadow-lg shadow-white/5"
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">{t.totalMembers} ({filteredMembers.length})</span>
                                {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent"></div>}
                            </div>

                            {filteredMembers.length > 0 ? filteredMembers.map((member: any) => (
                                <div key={member.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex gap-3 items-center animate-fade-in">
                                    <button
                                        onClick={() => onUserClick?.(member.profiles?.id)}
                                        className="relative active:scale-95 transition-transform"
                                    >
                                        <img src={member.profiles?.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-700" alt="" />
                                        {isOnline(member.profiles?.last_seen_at) && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-900 rounded-full"></div>}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-bold text-sm truncate">{member.profiles?.username}</h3>
                                        <span className="text-[10px] text-gray-500 block truncate">Room: {member.chat_rooms?.name}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleMute(member)}
                                            className={`p-2 rounded-lg transition-colors ${member.is_muted ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'text-gray-500 hover:text-yellow-500 bg-gray-800'}`}
                                            title={member.is_muted ? 'Unmute' : t.muteUser}
                                        >
                                            <MicOff size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleBan(member)}
                                            className={`p-2 rounded-lg transition-colors ${member.is_banned ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'text-gray-500 hover:text-red-500 bg-gray-800'}`}
                                            title={member.is_banned ? 'Unban' : t.banUser}
                                        >
                                            <Ban size={16} />
                                        </button>
                                    </div>
                                </div>
                            )) : !loading && (
                                <div className="text-center py-10 text-gray-600 italic">No approved members found.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {roomToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setRoomToDelete(null)}></div>
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-sm relative z-10 animate-scale-up shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                            <Ban size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-athletic text-white text-center mb-2">{t.deleteRoom}</h3>
                        <p className="text-gray-400 text-center text-sm mb-6">{t.confirmDelete}</p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleDeleteRoom}
                                className="w-full py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
                            >
                                {t.delete}
                            </button>
                            <button
                                onClick={() => setRoomToDelete(null)}
                                className="w-full py-3 bg-gray-800 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-colors"
                            >
                                {t.cancel}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default OrganizerTools;
