import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, Calendar, Globe, ArrowRight, Key } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();

    // Init state from sessionStorage/localStorage or previous month
    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date();
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // If it's a fresh session, we ignore localStorage and use prevMonth
        const sessionStarted = sessionStorage.getItem('sessionStarted');
        if (!sessionStarted) {
            sessionStorage.setItem('sessionStarted', 'true');
            const monthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
            localStorage.setItem('selectedMonth', monthKey);
            return prevMonth;
        }

        const saved = localStorage.getItem('selectedMonth');
        if (saved) {
            const [year, month] = saved.split('-').map(Number);
            return new Date(year, month - 1, 1);
        }
        return prevMonth;
    });

    // Save to localStorage whenever date changes
    useEffect(() => {
        const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        localStorage.setItem('selectedMonth', monthKey);
    }, [currentDate]);

    const formatMonth = (date) => {
        return date.toLocaleDateString('da-DK', { year: 'numeric', month: 'long' });
    };

    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    const regions = [
        { id: 'dansk', name: 'Dansk', textColor: 'text-red-600 dark:text-red-400' },
        { id: 'norsk', name: 'Norsk', textColor: 'text-blue-600 dark:text-blue-400' },
        { id: 'svensk', name: 'Svensk', textColor: 'text-amber-600 dark:text-amber-500' }
    ];

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">Velkommen, {user?.full_name || user?.name || 'Gæst'}</h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">Lagerstyring & Oversigt</p>
                </div>

                {/* Month Navigator */}
                <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1.5 w-full md:w-auto">
                    <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center px-4 space-x-2 font-bold text-gray-700 dark:text-gray-200 flex-1 md:w-48 justify-center">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="capitalize whitespace-nowrap">{formatMonth(currentDate)}</span>
                    </div>
                    <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors">
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <Globe className="mr-2 h-5 w-5 text-blue-500" />
                Vælg Lager
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {regions.map((region) => (
                    <Link
                        key={region.id}
                        to={`/inventory/${region.id}`}
                        className="group bg-white dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300"
                    >
                        <div className="flex justify-between items-start">
                            <div className="mb-4"></div>
                            <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-300 group-hover:text-white" />
                            </div>
                        </div>
                        <h3 className={`text-xl font-bold transition-colors ${region.textColor}`}>{region.name} Lager</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Gå til lageroptælling for {formatMonth(currentDate)}</p>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
                    <div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Systemstatus</h3>
                        <div className="flex items-center mt-3">
                            <div className="h-2.5 w-2.5 bg-green-500 rounded-full mr-2"></div>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">Online</p>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-mono">v{__APP_VERSION__}</p>
                    </div>
                    <Link
                        to="/change-password"
                        className="mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm"
                    >
                        <Key className="h-4 w-4" />
                        <span>Skift adgangskode</span>
                    </Link>
                </div>

                {(user?.role === 'admin' || user?.role === 'superuser') && (
                    <Link
                        to="/reports"
                        className="md:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl text-white shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300"
                    >
                        <h3 className="text-blue-100/80 text-xs font-bold uppercase tracking-wider">Rapportering</h3>
                        <div className="flex justify-between items-end mt-2">
                            <div>
                                <p className="text-2xl font-bold">Se Samlet Lagerrapport</p>
                                <p className="text-blue-100/70 mt-1">Oversigt over alle regioner for {formatMonth(currentDate)}</p>
                            </div>
                            <ArrowRight className="h-8 w-8 text-white/50" />
                        </div>
                    </Link>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
