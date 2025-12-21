
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, TrendingUp, Gift, Gavel, ShoppingBag, ArrowUpRight, DollarSign, History, AlertCircle } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface MyEarningsProps {
    language: Language;
    onBack: () => void;
    currentUserId?: string;
}

const MyEarnings: React.FC<MyEarningsProps> = ({ language, onBack, currentUserId }) => {
    const t = TRANSLATIONS[language];
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        product: 0,
        auction: 0,
        gift: 0,
        total: 0
    });

    useEffect(() => {
        if (currentUserId) {
            fetchEarnings();
        }
    }, [currentUserId]);

    const fetchEarnings = async () => {
        setLoading(true);
        try {
            // 1. Fetch Product & Auction Earnings from order_items
            const { data: items, error: itemsError } = await supabase
                .from('order_items')
                .select('price, quantity, item_type')
                .eq('seller_id', currentUserId);

            if (itemsError) throw itemsError;

            let productSum = 0;
            let auctionSum = 0;

            items?.forEach(item => {
                const amount = (item.price || 0) * (item.quantity || 1);
                if (item.item_type === 'auction') {
                    auctionSum += amount;
                } else {
                    productSum += amount;
                }
            });

            // 2. Fetch Gift Earnings
            const { data: gifts, error: giftsError } = await supabase
                .from('received_gifts')
                .select('price')
                .eq('receiver_id', currentUserId);

            if (giftsError) throw giftsError;

            const giftSum = gifts?.reduce((acc, curr) => acc + (curr.price || 0), 0) || 0;

            setStats({
                product: productSum,
                auction: auctionSum,
                gift: giftSum,
                total: productSum + auctionSum + giftSum
            });
        } catch (err) {
            console.error('Error fetching earnings:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pb-24 animate-fade-in bg-black min-h-screen text-white">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 sticky top-0 bg-black/90 backdrop-blur z-30 border-b border-gray-800">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700"
                >
                    <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-athletic tracking-wide text-white">{t.myEarnings}</h2>
            </div>

            <div className="p-4 space-y-6">
                {/* Total Earnings Card - Premium Glassmorphism */}
                <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-red-600 via-red-900 to-black border border-red-500/30 shadow-2xl shadow-red-900/40 group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <TrendingUp size={120} />
                    </div>

                    <div className="relative z-10">
                        <p className="text-red-200 text-xs font-black uppercase tracking-[0.2em] mb-2">{t.totalEarnings}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black tracking-tight tracking-athletic">฿{stats.total.toLocaleString()}</span>
                            <span className="text-red-400 text-sm font-bold">THB</span>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                className="flex-1 bg-white hover:bg-red-50 text-black py-4 rounded-2xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-black/20"
                                onClick={() => alert('Withdraw functionality coming soon!')}
                            >
                                <Wallet size={18} />
                                {t.withdraw}
                            </button>
                            <button className="w-14 h-14 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl flex items-center justify-center transition-all backdrop-blur-md">
                                <History size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Background Decorative Circles */}
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl"></div>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {/* Products */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-5 flex items-center justify-between group hover:border-blue-500/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <ShoppingBag size={24} />
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{t.productEarnings}</p>
                                <p className="text-xl font-black">฿{stats.product.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="text-blue-500/30 group-hover:text-blue-500 transition-colors">
                            <ArrowUpRight size={24} />
                        </div>
                    </div>

                    {/* Auctions */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-5 flex items-center justify-between group hover:border-yellow-500/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 group-hover:bg-yellow-500 group-hover:text-white transition-all">
                                <Gavel size={24} />
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{t.auctionEarnings}</p>
                                <p className="text-xl font-black">฿{stats.auction.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="text-yellow-500/30 group-hover:text-yellow-500 transition-colors">
                            <ArrowUpRight size={24} />
                        </div>
                    </div>

                    {/* Gifts */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-5 flex items-center justify-between group hover:border-pink-500/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all">
                                <Gift size={24} />
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{t.giftEarnings}</p>
                                <p className="text-xl font-black">฿{stats.gift.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="text-pink-500/30 group-hover:text-pink-500 transition-colors">
                            <ArrowUpRight size={24} />
                        </div>
                    </div>
                </div>

                {/* Withdrawal Notice */}
                <div className="bg-gray-900/30 border border-blue-900/30 rounded-2xl p-4 flex gap-3">
                    <AlertCircle className="text-blue-400 shrink-0" size={20} />
                    <p className="text-xs text-blue-100/70 leading-relaxed italic">
                        {t.withdrawDesc}
                        <span className="block mt-1 font-bold text-blue-400">Processing time: 1-3 business days.</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MyEarnings;
