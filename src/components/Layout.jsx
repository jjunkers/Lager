import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Globe, LogOut, Package, Users, ShoppingCart, Home, Clock, Settings, Key, Bell } from 'lucide-react';
import { useStats } from '../context/StatsContext';
import MobileBottomNav from './MobileBottomNav';
import VersionHistoryModal from './VersionHistoryModal';
import { useState } from 'react';

const Layout = () => {
    const { user, logout } = useAuth();
    const { stats } = useStats();
    const navigate = useNavigate();
    const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const Badge = ({ count, color = 'bg-red-500' }) => {
        if (!count || count === 0) return null;
        return (
            <span className={`ml-auto flex h-5 w-5 items-center justify-center rounded-full ${color} text-[10px] font-bold text-white shadow-sm animate-pulse-subtle`}>
                {count > 99 ? '99+' : count}
            </span>
        );
    };

    const navItems = [
        { name: 'Rapporter', path: '/reports', icon: BarChart3, roles: ['admin', 'superuser', 'user'] },
        { name: 'Dansk', path: '/inventory/dansk', icon: Globe, activeColor: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
        { name: 'Norsk', path: '/inventory/norsk', icon: Globe, activeColor: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
        { name: 'Svensk', path: '/inventory/svensk', icon: Globe, activeColor: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
        { name: 'Mine Bestillinger', path: '/my-orders', icon: Clock, badge: stats.user_active_orders, roles: ['user', 'viewer'], hideIfEmpty: true },
        { name: 'Bestil Publikationer', path: '/create-order', icon: ShoppingCart, roles: ['admin', 'user', 'superuser'] },
    ].filter(item => {
        if (item.roles && !item.roles.includes(user?.role)) return false;
        if (item.hideIfEmpty && !item.badge) return false;
        return true;
    });

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-200 overflow-x-hidden">
            {/* Style for badge animation */}
            <style>{`
                @keyframes pulse-subtle {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.95; }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 2s infinite ease-in-out;
                }
            `}</style>

            {/* Desktop Sidebar — hidden on mobile */}
            <aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex p-6 border-b border-gray-100 dark:border-gray-700 items-center space-x-3">
                    <div className="bg-blue-600 p-2 rounded-lg relative">
                        <Package className="text-white h-6 w-6" />
                        {(stats.orders_count > 0 || stats.shipped_count > 0) && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                        )}
                    </div>
                    <span className="text-xl font-bold tracking-tight text-gray-800 dark:text-white">LagerSystem</span>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                            }`
                        }
                    >
                        <Home className="h-5 w-5 opacity-70" />
                        <span>Velkommen</span>
                    </NavLink>

                    <div className="pt-4 pb-2 px-4">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Lagerstyring</p>
                    </div>

                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) => {
                                const activeClasses = item.activeColor || 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
                                return `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                    ? `${activeClasses} font-medium shadow-sm`
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`;
                            }}
                        >
                            <item.icon className="h-5 w-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                            <span className="flex-1">{item.name}</span>
                            {item.badge > 0 && <Badge count={item.badge} />}
                        </NavLink>
                    ))}

                    {user?.role === 'admin' && (
                        <>
                            <div className="pt-4 pb-2 px-4">
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Administration</p>
                            </div>
                            <NavLink
                                to="/orders"
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`
                                }
                            >
                                <ShoppingCart className="h-5 w-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                                <span className="flex-1">Bestillinger</span>
                                <Badge count={stats.orders_count} color="bg-red-500" />
                            </NavLink>
                            <NavLink
                                to="/ordered"
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`
                                }
                            >
                                <Clock className="h-5 w-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                                <span className="flex-1">Bestilte</span>
                                <Badge count={stats.shipped_count} color="bg-purple-500" />
                            </NavLink>
                            <NavLink
                                to="/catalog"
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`
                                }
                            >
                                <Package className="h-5 w-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                                <span>Publikationer</span>
                            </NavLink>
                            <NavLink
                                to="/users"
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`
                                }
                            >
                                <Users className="h-5 w-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                                <span>Brugere</span>
                            </NavLink>
                            <div className="pt-4 pb-2 px-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">System</p>
                            </div>
                            <NavLink
                                to="/admin"
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`
                                }
                            >
                                <Settings className="h-5 w-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                                <span className="flex-1">System Admin</span>
                            </NavLink>
                        </>
                    )}

                    <div className="pt-4 pb-2 px-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Konto</p>
                    </div>
                    <NavLink
                        to="/change-password"
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                            }`
                        }
                    >
                        <Key className="h-5 w-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                        <span>Skift adgangskode</span>
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-center space-x-3 px-4 py-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                            {user?.username?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.full_name || user?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Log ud</span>
                    </button>
                    <div className="mt-4 flex justify-center">
                        <button
                            onClick={() => setIsVersionModalOpen(true)}
                            className="text-[10px] text-gray-400 dark:text-gray-500 font-mono tracking-wide hover:text-blue-500 transition-colors"
                        >
                            v{__APP_VERSION__}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content — with bottom padding on mobile for nav bar */}
            <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200 pb-28 md:pb-0 relative">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation — hidden on desktop */}
            <MobileBottomNav />

            <VersionHistoryModal
                isOpen={isVersionModalOpen}
                onClose={() => setIsVersionModalOpen(false)}
            />
        </div>
    );
};

export default Layout;
