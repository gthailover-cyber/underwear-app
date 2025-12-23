import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Check, X, ShieldCheck, Users } from 'lucide-react';

interface InviteModalProps {
    invite: any; // Notification object
    onAccept: (invite: any) => void;
    onDecline: (invite: any) => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ invite, onAccept, onDecline }) => {
    const [host, setHost] = useState<any>(null);
    const [room, setRoom] = useState<any>(null);

    useEffect(() => {
        // Fetch host and room details from the invite metadata or actor
        // Assuming invite.actor is the host
        setHost(invite.actor);

        // Fetch room details if provided in metadata (we need to ensure we send it)
        if (invite.metadata?.room_id) {
            fetchRoom(invite.metadata.room_id);
        }
    }, [invite]);

    const fetchRoom = async (roomId: string) => {
        const { data } = await supabase.from('chat_rooms').select('*').eq('id', roomId).single();
        if (data) setRoom(data);
    };

    if (!host) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-sm bg-gray-900 rounded-[32px] overflow-hidden border border-amber-500/20 shadow-2xl shadow-amber-900/20 relative">

                {/* Decorative Background */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-amber-600/20 to-transparent"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl"></div>

                <div className="relative p-8 flex flex-col items-center text-center">

                    {/* Host Avatar (Pulsing) */}
                    <div className="relative mb-6">
                        <div className="absolute -inset-3 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-full opacity-30 animate-pulse"></div>
                        <div className="relative w-24 h-24 rounded-full p-[3px] bg-gradient-to-r from-amber-400 to-yellow-600 shadow-xl">
                            <img src={host.avatar} className="w-full h-full rounded-full object-cover border-4 border-gray-900" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 bg-black rounded-full flex items-center justify-center border-2 border-gray-800 shadow-lg">
                                <ShieldCheck size={16} className="text-amber-500" />
                            </div>
                        </div>
                    </div>

                    <h2 className="text-amber-500 font-bold tracking-widest text-xs uppercase mb-2">Incoming Live Invitation</h2>
                    <h3 className="text-2xl font-black text-white leading-tight mb-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{host.username}</span>
                    </h3>
                    <p className="text-gray-400 text-sm mb-6 px-4">
                        invited you to co-host in room <br />
                        <span className="text-white font-bold">"{room?.name || 'Loading...'}"</span>
                    </p>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <button
                            onClick={() => onDecline(invite)}
                            className="py-3 px-4 rounded-xl bg-gray-800 text-gray-400 font-bold text-sm hover:bg-gray-700 active:scale-95 transition-all border border-gray-700"
                        >
                            Decline
                        </button>
                        <button
                            onClick={() => onAccept(invite)}
                            className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
                        >
                            <Check size={18} strokeWidth={3} /> Accept
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default InviteModal;
