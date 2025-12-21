import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, HelpCircle, X } from 'lucide-react';

interface NiceAlertProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

const NiceAlert: React.FC<NiceAlertProps> = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    onConfirm,
    onCancel,
    confirmText = 'OK',
    cancelText = 'Cancel'
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 className="text-green-500" size={48} />;
            case 'error': return <XCircle className="text-red-500" size={48} />;
            case 'warning': return <AlertTriangle className="text-yellow-500" size={48} />;
            case 'confirm': return <HelpCircle className="text-blue-500" size={48} />;
            default: return <Info className="text-blue-500" size={48} />;
        }
    };

    const getThemeColor = () => {
        switch (type) {
            case 'success': return 'from-green-500/20 to-green-600/5 border-green-500/30';
            case 'error': return 'from-red-500/20 to-red-600/5 border-red-500/30';
            case 'warning': return 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30';
            case 'confirm': return 'from-blue-500/20 to-blue-600/5 border-blue-500/30';
            default: return 'from-blue-500/20 to-blue-600/5 border-blue-500/30';
        }
    };

    const getBtnColor = () => {
        switch (type) {
            case 'success': return 'bg-green-600 hover:bg-green-500 shadow-green-900/40';
            case 'error': return 'bg-red-600 hover:bg-red-500 shadow-red-900/40';
            case 'warning': return 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/40';
            case 'confirm': return 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40';
            default: return 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40';
        }
    };

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        onClose();
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div
                className={`w-full max-w-sm bg-gradient-to-br ${getThemeColor()} bg-gray-900 rounded-3xl border p-8 text-center shadow-2xl animate-scale-in relative overflow-hidden`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Shine effect */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex justify-center mb-6 animate-bounce-subtle">
                        {getIcon()}
                    </div>

                    {title && (
                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                            {title}
                        </h3>
                    )}

                    <p className="text-gray-300 text-sm leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleConfirm}
                            className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all active:scale-95 shadow-lg ${getBtnColor()}`}
                        >
                            {confirmText}
                        </button>

                        {type === 'confirm' && (
                            <button
                                onClick={handleCancel}
                                className="w-full py-3 text-gray-400 hover:text-white font-medium text-sm transition-colors"
                            >
                                {cancelText}
                            </button>
                        )}
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default NiceAlert;
