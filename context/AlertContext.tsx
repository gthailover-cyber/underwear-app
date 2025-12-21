
import React, { createContext, useContext, useState, ReactNode } from 'react';
import NiceAlert from '../components/NiceAlert';

type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface AlertOptions {
    title?: string;
    message: string;
    type?: AlertType;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

interface AlertContextType {
    showAlert: (options: AlertOptions) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<AlertOptions | null>(null);

    const showAlert = (newOptions: AlertOptions) => {
        setOptions(newOptions);
        setIsOpen(true);
    };

    const hideAlert = () => {
        setIsOpen(false);
        setTimeout(() => setOptions(null), 300); // Wait for animation
    };

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            {options && (
                <NiceAlert
                    isOpen={isOpen}
                    onClose={hideAlert}
                    {...options}
                />
            )}
        </AlertContext.Provider>
    );
};
