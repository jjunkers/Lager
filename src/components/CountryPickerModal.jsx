import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, ShoppingCart, Key, LogOut, Home } from 'lucide-react';

const regions = [
    { id: 'dansk', name: 'Dansk Lager', color: 'text-red-600 dark:text-red-400', subtitle: 'Danmark' },
    { id: 'norsk', name: 'Norsk Lager', color: 'text-blue-600 dark:text-blue-400', subtitle: 'Norge' },
    { id: 'svensk', name: 'Svensk Lager', color: 'text-yellow-600 dark:text-yellow-500', subtitle: 'Sverige' },
];

const CountryPickerModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Small delay to trigger CSS transition
            requestAnimationFrame(() => setIsVisible(true));
            setIsAnimatingOut(false);
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsAnimatingOut(true);
        setIsVisible(false);
        setTimeout(() => {
            setIsAnimatingOut(false);
            onClose();
        }, 300);
    };

    const handleSelect = (regionId) => {
        navigate(`/inventory/${regionId}`);
        handleClose();
    };

    if (!isOpen && !isAnimatingOut) return null;

    return (
        <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={handleClose}
            />

            {/* Bottom Sheet */}
            <div
                className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pb-4 pt-2">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Vælg Lager</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Country Cards */}
                <div className="px-6 pb-4 space-y-3">
                    {regions.map((region, index) => (
                        <button
                            key={region.id}
                            onClick={() => handleSelect(region.id)}
                            className="w-full flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 border border-gray-100 dark:border-gray-600 transition-all duration-200 active:scale-[0.98]"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex-1 text-left">
                                <p className={`text-lg font-black ${region.color}`}>{region.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{region.subtitle}</p>
                            </div>
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Quick Links */}
                <div className="px-6 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 flex space-x-3">
                    <button
                        onClick={() => { navigate('/'); handleClose(); }}
                        className="flex items-center justify-center space-x-2 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        <Home className="h-4 w-4" />
                        <span>Hjem</span>
                    </button>
                    <button
                        onClick={() => { navigate('/create-order'); handleClose(); }}
                        className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
                    >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Bestil</span>
                    </button>
                    <button
                        onClick={() => { navigate('/change-password'); handleClose(); }}
                        className="flex items-center justify-center space-x-2 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        <Key className="h-4 w-4" />
                    </button>
                </div>

                {/* Log ud */}
                <div className="px-6 pb-8 border-t border-gray-100 dark:border-gray-700 mt-2 pt-4">
                    <button
                        onClick={() => {
                            handleClose();
                            setTimeout(() => {
                                logout();
                                navigate('/login', { replace: true });
                            }, 100);
                        }}
                        className="w-full flex items-center justify-center space-x-2 py-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-[0.98] transition-all border border-red-100/50 dark:border-red-900/30 shadow-sm"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Log ud</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CountryPickerModal;
