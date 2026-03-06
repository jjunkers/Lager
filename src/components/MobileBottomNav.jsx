import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStats } from '../context/StatsContext';
import { BarChart3, Globe, ShoppingCart, Clock, Settings, LogOut, RefreshCw } from 'lucide-react';
import CountryPickerModal from './CountryPickerModal';
import VersionHistoryModal from './VersionHistoryModal';

const MobileBottomNav = () => {
    const { user, logout } = useAuth();
    const { stats } = useStats();
    const navigate = useNavigate();
    const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
    const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

    const isAdmin = user?.role === 'admin';
    const isSuperuser = user?.role === 'superuser';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Badge component
    const Badge = ({ count, color = 'bg-red-500' }) => {
        if (!count || count === 0) return null;
        return (
            <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full ${color} text-[8px] font-bold text-white shadow-sm`}>
                {count > 99 ? '99+' : count}
            </span>
        );
    };

    // Build nav items based on role
    const leftItems = [];
    const rightItems = [];

    const isUser = user?.role === 'user';

    if (isAdmin || isSuperuser || isUser) {
        leftItems.push({
            name: 'Rapporter',
            path: '/reports',
            icon: BarChart3,
        });
    }

    if (!isAdmin && !isSuperuser && stats.user_active_orders > 0) {
        leftItems.push({
            name: 'Mine Best',
            path: '/my-orders',
            icon: Clock,
            badge: stats.user_active_orders,
            badgeColor: 'bg-blue-500',
        });
    }

    if (isAdmin) {
        leftItems.push({
            name: 'Bestillinger',
            path: '/orders',
            icon: ShoppingCart,
            badge: stats.orders_count,
            badgeColor: 'bg-red-500',
        });

        rightItems.push({
            name: 'Bestilte',
            path: '/ordered',
            icon: Clock,
            badge: stats.shipped_count,
            badgeColor: 'bg-purple-500',
        });

        rightItems.push({
            name: 'Admin',
            path: '/admin',
            icon: Settings,
        });
    }

    // Pad arrays so globe stays centered (max 2 items per side)
    while (leftItems.length < 2) leftItems.unshift(null);
    while (rightItems.length < 2) rightItems.push(null);

    const NavButton = ({ item }) => {
        if (!item) {
            // Empty spacer
            return <div className="w-14" />;
        }

        return (
            <NavLink
                to={item.path}
                className={({ isActive }) =>
                    `relative flex flex-col items-center justify-center w-14 transition-all duration-200 ${isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`
                }
            >
                {({ isActive }) => (
                    <>
                        <div className={`relative p-2 rounded-full transition-all duration-200 ${isActive
                            ? 'bg-blue-100 dark:bg-blue-900/40 scale-110'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}>
                            <item.icon className="h-5 w-5" />
                            <Badge count={item.badge} color={item.badgeColor} />
                        </div>
                        <span className={`text-[10px] mt-0.5 font-medium transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : ''
                            }`}>
                            {item.name}
                        </span>
                    </>
                )}
            </NavLink>
        );
    };

    return (
        <>
            {/* Country Picker Modal */}
            <CountryPickerModal
                isOpen={isCountryPickerOpen}
                onClose={() => setIsCountryPickerOpen(false)}
            />

            <VersionHistoryModal
                isOpen={isVersionModalOpen}
                onClose={() => setIsVersionModalOpen(false)}
            />

            {/* Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40">
                {/* Gradient shadow above bar */}
                <div className="h-6 bg-gradient-to-t from-white/80 dark:from-gray-900/80 to-transparent pointer-events-none" />

                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 px-2 pb-safe">
                    <div className="flex items-center justify-between px-4 pt-1.5 -mb-0.5">
                        <button
                            onClick={() => setIsVersionModalOpen(true)}
                            className="text-[10px] text-gray-400 dark:text-gray-500 font-mono tracking-wide hover:text-blue-500 transition-colors"
                        >
                            v{__APP_VERSION__}
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-1 p-0.5 rounded-full text-gray-400 dark:text-gray-500 hover:text-blue-500 active:animate-spin transition-colors"
                            aria-label="Genindlæs"
                        >
                            <RefreshCw className="h-3 w-3" />
                        </button>
                    </div>
                    <div className="flex items-end justify-around py-1.5 max-w-md mx-auto">
                        {/* Left items */}
                        {leftItems.map((item, i) => (
                            <NavButton key={item?.path || `left-${i}`} item={item} />
                        ))}

                        {/* Central Globe Button — opens country picker */}
                        <div className="flex flex-col items-center -mt-5">
                            <button
                                onClick={() => setIsCountryPickerOpen(true)}
                                className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all duration-200 globe-pulse-btn"
                            >
                                <Globe className="h-7 w-7" />
                            </button>
                            <span className="text-[10px] mt-1 font-semibold text-blue-600 dark:text-blue-400">Lager</span>
                        </div>

                        {/* Right items */}
                        {rightItems.map((item, i) => (
                            <NavButton key={item?.path || `right-${i}`} item={item} />
                        ))}
                    </div>
                </div>
            </nav>
        </>
    );
};

export default MobileBottomNav;
