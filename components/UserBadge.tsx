
import React from 'react';
import { BicepsFlexed, Crown, Gem } from 'lucide-react';
import { UserRole } from '../types';

interface UserBadgeProps {
    role?: UserRole;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
}

const UserBadge: React.FC<UserBadgeProps> = ({ role, size = 'sm', className = '' }) => {
    if (!role) return null;

    const getIcon = () => {
        switch (role) {
            case 'model':
                return <BicepsFlexed className="text-white" size={size === 'xs' ? 8 : size === 'sm' ? 10 : size === 'md' ? 14 : 18} />;
            case 'organizer':
                return <Crown className="text-white fill-white" size={size === 'xs' ? 8 : size === 'sm' ? 10 : size === 'md' ? 14 : 18} />;
            case 'supporter':
                return <Gem className="text-white" size={size === 'xs' ? 8 : size === 'sm' ? 10 : size === 'md' ? 14 : 18} />;
            default:
                return null;
        }
    };

    const getColorClass = () => {
        switch (role) {
            case 'model':
                return 'bg-gradient-to-br from-red-600 to-orange-500 shadow-red-900/40';
            case 'organizer':
                return 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-yellow-900/40';
            case 'supporter':
                return 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-900/40';
            default:
                return 'bg-gray-500';
        }
    };

    const sizeClasses = {
        xs: 'w-3 h-3 border-[1px]',
        sm: 'w-4 h-4 border-[1.5px]',
        md: 'w-6 h-6 border-2',
        lg: 'w-8 h-8 border-2'
    };

    return (
        <div className={`
      ${sizeClasses[size]} 
      ${getColorClass()} 
      ${className}
      rounded-full flex items-center justify-center border-black shadow-lg z-10
    `}>
            {getIcon()}
        </div>
    );
};

export default UserBadge;
