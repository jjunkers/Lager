import React, { useEffect, useState } from 'react';
import { X, Clock, ChevronRight } from 'lucide-react';
import changelogData from '../data/changelog.json';

const VersionHistoryModal = ({ isOpen, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    useEffect(() => {
        if (isOpen) {
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

    if (!isOpen && !isAnimatingOut) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={handleClose}
            />

            {/* Modal / Bottom Sheet */}
            <div
                className={`relative w-full max-w-lg bg-white dark:bg-gray-800 shadow-2xl transition-all duration-300 ease-out 
                    ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full md:translate-y-10 opacity-0 md:scale-95'}
                    rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col bottom-0 md:bottom-auto absolute md:relative`}
            >
                {/* Mobile Handle */}
                <div className="flex justify-center pt-3 pb-1 md:hidden">
                    <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Versionshistorik</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Se hvad der er sket i systemet</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                    {changelogData.map((entry, index) => (
                        <div key={entry.version} className="relative pl-8 border-l-2 border-blue-100 dark:border-blue-900/50 pb-2">
                            {/* Dot */}
                            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white dark:bg-gray-800 border-2 border-blue-500 shadow-sm" />

                            <div className="flex items-center justify-between mb-2">
                                <span className="px-2 py-0.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider">
                                    v{entry.version}
                                </span>
                                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 font-mono">
                                    {entry.date}
                                </span>
                            </div>

                            <ul className="space-y-2.5">
                                {entry.changes.map((change, cIdx) => (
                                    <li key={cIdx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                        <ChevronRight className="h-3 w-3 mt-1 text-blue-500 shrink-0" />
                                        <span>{change}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-3xl">
                    <button
                        onClick={handleClose}
                        className="w-full py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-all active:scale-[0.98]"
                    >
                        Luk
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VersionHistoryModal;
