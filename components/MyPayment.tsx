
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Gift, Calendar, ChevronDown, ShoppingBag, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS, GIFTS } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface MyPaymentProps {
    language: Language;
    onBack: () => void;
}

interface PaymentTransaction {
    id: string;
    type: 'order' | 'gift';
    amount: number;
    description: string;
    date: string;
    icon: React.ReactNode;
    color: string;
}

const MyPayment: React.FC<MyPaymentProps> = ({ language, onBack }) => {
    const t = TRANSLATIONS[language];
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [months, setMonths] = useState<string[]>([]);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setLoading(false);
            return;
        }

        const allTransactions: PaymentTransaction[] = [];

        // 1. Fetch Orders (ซื้อสินค้า)
        try {
            const { data: orders } = await supabase
                .from('orders')
                .select('id, total_amount, created_at, order_items(product_name)')
                .eq('buyer_id', user.id)
                .order('created_at', { ascending: false });

            if (orders) {
                orders.forEach((order: any) => {
                    const productNames = order.order_items?.map((item: any) => item.product_name).join(', ') || 'Products';
                    allTransactions.push({
                        id: `order-${order.id}`,
                        type: 'order',
                        amount: order.total_amount,
                        description: productNames,
                        date: order.created_at,
                        icon: <Package size={20} />,
                        color: 'blue'
                    });
                });
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
        }

        // 2. Fetch Gifts Sent (ของขวัญที่ส่ง)
        try {
            const { data: gifts } = await supabase
                .from('messages')
                .select('id, content, created_at, receiver:receiver_id(username)')
                .eq('sender_id', user.id)
                .eq('type', 'gift')
                .order('created_at', { ascending: false });

            if (gifts) {
                gifts.forEach((gift: any) => {
                    try {
                        const meta = JSON.parse(gift.content);
                        const giftData = GIFTS.find(g => g.id == meta.giftId);
                        if (giftData) {
                            allTransactions.push({
                                id: `gift-${gift.id}`,
                                type: 'gift',
                                amount: giftData.price,
                                description: `${giftData.name} to ${gift.receiver?.username || 'User'}`,
                                date: gift.created_at,
                                icon: <Gift size={20} />,
                                color: giftData.color
                            });
                        }
                    } catch (e) {
                        console.error('Error parsing gift:', e);
                    }
                });
            }
        } catch (err) {
            console.error('Error fetching gifts:', err);
        }

        // Sort by date (newest first)
        allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setTransactions(allTransactions);

        // Extract unique months for filter
        const uniqueMonths = Array.from(
            new Set(
                allTransactions.map(t => {
                    const date = new Date(t.date);
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                })
            )
        );
        setMonths(['all', ...uniqueMonths]);

        setLoading(false);
    };

    const filteredTransactions = selectedMonth === 'all'
        ? transactions
        : transactions.filter(t => {
            const date = new Date(t.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return monthKey === selectedMonth;
        });

    const totalSpent = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

    const getColorClass = (color: string) => {
        const colors: Record<string, string> = {
            blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            red: 'bg-red-500/10 text-red-500 border-red-500/20',
            pink: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
            orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
            yellow: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            green: 'bg-green-500/10 text-green-500 border-green-500/20'
        };
        return colors[color] || colors.blue;
    };

    const formatMonth = (monthKey: string) => {
        if (monthKey === 'all') return language === 'th' ? 'ทั้งหมด' : 'All';
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
            year: 'numeric',
            month: 'long'
        });
    };

    return (
        <div className="pb-24 animate-fade-in bg-black min-h-screen flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 sticky top-0 bg-black/90 backdrop-blur z-30 border-b border-gray-800">
                <button
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700"
                >
                    <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-athletic tracking-wide text-white">{t.myPayment}</h2>
            </div>

            {/* Summary Card */}
            <div className="p-4">
                <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-2xl p-6 shadow-xl shadow-red-900/30 border border-red-500/20 relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <p className="text-red-100/80 text-xs font-bold uppercase tracking-[0.2em] mb-2">
                            {language === 'th' ? 'ยอดรวมที่จ่าย' : 'Total Spent'}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-4xl font-black text-white font-athletic tracking-tight">
                                {totalSpent.toLocaleString()}
                            </h3>
                            <span className="text-red-200 text-sm font-bold">{t.coins}</span>
                        </div>
                        <div className="mt-4 flex items-center gap-4 pt-3 border-t border-white/10">
                            <div className="flex flex-col">
                                <span className="text-[9px] text-red-100/60 font-medium uppercase tracking-wider">
                                    {language === 'th' ? 'รายการ' : 'Transactions'}
                                </span>
                                <span className="text-base font-bold text-white">{filteredTransactions.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Month Filter */}
            <div className="px-4 pb-2">
                <div className="relative">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white appearance-none cursor-pointer focus:border-red-600 focus:outline-none pr-10"
                    >
                        {months.map(month => (
                            <option key={month} value={month}>
                                {formatMonth(month)}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
            </div>

            {/* Transactions List */}
            <div className="flex-1 px-4 space-y-3 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center pt-20">
                        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredTransactions.length > 0 ? (
                    filteredTransactions.map(transaction => (
                        <div
                            key={transaction.id}
                            className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-gray-700 transition-all group"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getColorClass(transaction.color)} flex-shrink-0`}>
                                    {transaction.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${transaction.type === 'order'
                                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                : 'bg-pink-500/10 text-pink-500 border-pink-500/20'
                                            }`}>
                                            {transaction.type === 'order'
                                                ? (language === 'th' ? 'ซื้อสินค้า' : 'Purchase')
                                                : (language === 'th' ? 'ของขวัญ' : 'Gift')}
                                        </span>
                                    </div>
                                    <h4 className="text-white text-sm font-bold line-clamp-1">{transaction.description}</h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(transaction.date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                                <p className="text-lg font-black text-red-500 font-athletic">
                                    -{transaction.amount.toLocaleString()}
                                </p>
                                <p className="text-[10px] text-gray-500 font-medium">{t.coins}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Sparkles size={48} className="mb-4 opacity-50" />
                        <p>{language === 'th' ? 'ยังไม่มีรายการจ่ายเงิน' : 'No payment history'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyPayment;
