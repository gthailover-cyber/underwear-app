
import React from 'react';
import { Lock, X, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface JoinRequestModalProps {
    room: {
        id: string;
        name: string;
        image: string;
        host_name: string;
    };
    status: 'none' | 'pending' | 'rejected';
    onClose: () => void;
    onRequestJoin: () => void;
}

const JoinRequestModal: React.FC<JoinRequestModalProps> = ({
    room,
    status,
    onClose,
    onRequestJoin
}) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl animate-scale-up">

                {/* Header Image */}
                <div className="relative h-48">
                    <img src={room.image} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent"></div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                        <div className="w-16 h-16 rounded-2xl bg-yellow-500 flex items-center justify-center shadow-xl shadow-yellow-500/20 rotate-3">
                            <Lock size={32} className="text-black -rotate-3" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pt-10 pb-8 text-center">
                    <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter italic">Private Room</h3>
                    <p className="text-gray-400 text-sm mb-6">Hosted by <span className="text-yellow-500 font-bold">{room.host_name}</span></p>

                    <div className="bg-gray-800/50 rounded-2xl p-4 mb-8 border border-gray-800">
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {status === 'pending'
                                ? "Your request has been sent! Please wait for the host to confirm your access."
                                : "This is a private community. You need to be approved by the host before joining."
                            }
                        </p>
                    </div>

                    {status === 'pending' ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20 animate-pulse">
                                <Clock size={16} />
                                WAITING FOR APPROVAL
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-500 text-xs font-medium hover:text-white transition-colors"
                            >
                                Close and wait
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={onRequestJoin}
                                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-900/25"
                            >
                                <ShieldCheck size={20} />
                                REQUEST TO JOIN
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl transition-all"
                            >
                                Not now
                            </button>
                        </div>
                    )}
                </div>

                {/* Bottom Badge */}
                <div className="bg-gray-800/30 py-3 px-6 border-t border-gray-800/50 flex items-center justify-center gap-2">
                    <CheckCircle2 size={12} className="text-gray-500" />
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Verified Members Only</span>
                </div>
            </div>
        </div>
    );
};

export default JoinRequestModal;
