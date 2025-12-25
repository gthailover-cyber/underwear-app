import React, { useState, useEffect } from 'react';
import { X, Check, Activity, Coins, HeartHandshake, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAlert } from '../context/AlertContext';

interface LiveConfirmationModalProps {
    notification: any;
    onClose: () => void;
    onConfirm: () => void;
}

const LiveConfirmationModal: React.FC<LiveConfirmationModalProps> = ({ notification, onClose, onConfirm }) => {
    const { showAlert } = useAlert();
    const { room_id, goal_id } = notification.metadata || {};
    const [step, setStep] = useState<'initial' | 'warning'>('initial');
    const [roomName, setRoomName] = useState<string>('Group Chat');

    useEffect(() => {
        const fetchRoomName = async () => {
            if (room_id) {
                const { data } = await supabase.from('chat_rooms').select('name').eq('id', room_id).single();
                if (data) setRoomName(data.name);
            }
        };
        fetchRoomName();
    }, [room_id]);

    const handleConfirm = async () => {
        if (step === 'initial') {
            setStep('warning');
            return;
        }

        try {
            // 1. Update invite status to 'live_confirmed' (optional, or just reuse accepted)
            // 2. Ideally proceed to join room as Live
            onConfirm();
        } catch (error) {
            console.error('Error confirming live:', error);
        }
    };

    const handleReject = async () => {
        try {
            // 1. Helper function to refund everyone
            const { error } = await supabase.rpc('refund_goal_donations', { p_goal_id: goal_id });
            if (error) throw error;

            // 2. Notify Host/Room
            await supabase.from('room_messages').insert({
                room_id: room_id,
                // System message usually doesn't need sender_id if RLS allows, but usually we use current user (the model)
                sender_id: notification.user_id,
                content: '❌ นายแบบปฏิเสธการเข้า Live - ระบบกำลังทำการคืนเงินให้ผู้บริจาคทุกท่าน'
            });

            showAlert({ message: 'Refund initiated successfully', type: 'info' });
            onClose();
        } catch (error: any) {
            console.error('Error rejecting live & refunding:', error, error.message, error.details, error.hint);
            showAlert({ message: `Error processing refund: ${error.message || 'Unknown error'}`, type: 'error' });
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-6 border border-amber-500/30 shadow-2xl shadow-amber-900/40 relative overflow-hidden">

                {/* Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px]"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    {step === 'initial' ? (
                        <>
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-600 p-[3px] mb-4 shadow-lg shadow-amber-500/30">
                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                    <HeartHandshake size={40} className="text-amber-500" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-white italic uppercase tracking-wider mb-2">
                                Goal Reached!
                            </h2>
                            <p className="text-gray-300 text-sm mb-6 px-4">
                                ยอดบริจาคครบตามเป้าหมายแล้ว! คุณต้องการยืนยันการเข้า Live หรือไม่?
                                <br />
                                <span className="text-red-400 text-xs mt-2 block">(หากปฏิเสธ ระบบจะคืนเงินให้ผู้บริจาคทั้งหมดทันที)</span>
                            </p>

                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button
                                    onClick={handleReject}
                                    className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-red-900/30 border border-gray-700 hover:border-red-500/50 text-gray-300 hover:text-red-400 py-3 rounded-xl font-bold transition-all"
                                >
                                    <X size={18} />
                                    <span>No, Refund</span>
                                </button>

                                <button
                                    onClick={handleConfirm}
                                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black py-3 rounded-xl font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                                >
                                    <Check size={18} />
                                    <span>Yes, Let's Live!</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 rounded-full bg-red-500/10 p-4 mb-4 items-center justify-center flex border border-red-500/30 shadow-lg shadow-red-900/20">
                                <AlertTriangle size={40} className="text-red-500 animate-pulse" />
                            </div>

                            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">
                                Important!
                            </h2>
                            <p className="text-gray-300 text-sm mb-8 px-2 leading-relaxed">
                                กรุณาเข้าไปที่ห้อง <span className="text-white font-bold">"{roomName}"</span> และเริ่ม Live ภายใน <span className="text-yellow-400 font-bold text-lg">1 นาที</span>
                                <br />
                                <span className="text-red-400 text-xs mt-2 block">หากไม่ทัน ระบบจะยกเลิกและคืนเงินผู้บริจาคโดยอัตโนมัติ</span>
                            </p>

                            <button
                                onClick={handleConfirm}
                                className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 py-3 rounded-xl font-black text-lg transition-all active:scale-95"
                            >
                                ตกลง และ ไปที่ห้องทันที
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveConfirmationModal;
