import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader, Printer, FileDown, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const Reports = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date();
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // If it's a fresh session, we ignore localStorage and use prevMonth
        const sessionStarted = sessionStorage.getItem('sessionStarted');
        if (!sessionStarted) {
            sessionStorage.setItem('sessionStarted', 'true');
            // Use local date parts to avoid UTC timezone shifts
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
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);

    const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const formatMonth = (date) => date.toLocaleDateString('da-DK', { year: 'numeric', month: 'long' });
    const currentMonthKey = getMonthKey(currentDate);

    const fetchRegionData = async (region) => {
        try {
            const res = await fetch(`/api/inventory/${region}/${currentMonthKey}?role=${user?.role}`);
            return res.ok ? await res.json() : [];
        } catch (e) {
            console.error(`Failed to fetch ${region} data`, e);
            return [];
        }
    };

    const fetchCatalog = async () => {
        try {
            const res = await fetch(`/api/catalog?role=${user?.role}`);
            return res.ok ? await res.json() : [];
        } catch (e) {
            console.error("Failed to fetch catalog", e);
            return [];
        }
    };

    useEffect(() => {
        const loadReport = async () => {
            setLoading(true);
            const [catalog, dkData, noData, seData] = await Promise.all([
                fetchCatalog(),
                fetchRegionData('dansk'),
                fetchRegionData('norsk'),
                fetchRegionData('svensk')
            ]);

            // Merge Data
            const merged = catalog.map(item => {
                // Helper to get data or seed for Jan 2026
                const getData = (data, region) => {
                    const found = data.find(d => d.item_code === item.code);
                    if (found) return found;

                    // Seed Logic for Jan 2026
                    if (currentMonthKey === '2026-01') {
                        let qtyField = 'quantity_da';
                        if (region === 'norsk') qtyField = 'quantity_no';
                        if (region === 'svensk') qtyField = 'quantity_sv';
                        const lager = item[qtyField] || 0;
                        return { skab: 0, lager, total: lager };
                    }

                    return { skab: 0, lager: 0, total: 0 };
                };

                const dk = getData(dkData, 'dansk');
                const no = getData(noData, 'norsk');
                const se = getData(seData, 'svensk');

                return {
                    ...item,
                    dk,
                    no,
                    se,
                    grandTotal: (dk.total || 0) + (no.total || 0) + (se.total || 0)
                };
            });

            setReportData(merged);
            setLoading(false);
        };

        loadReport();
    }, [currentMonthKey]);

    const handlePrint = () => {
        window.print();
    };

    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);

        // Sync with global state
        const monthKey = newDate.toISOString().slice(0, 7);
        localStorage.setItem('selectedMonth', monthKey);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader className="h-10 w-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print-hidden">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Samlet Lagerrapport</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Oversigt over alle regioner</p>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
                    {/* Month Navigation */}
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

                    <button
                        onClick={handlePrint}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 md:py-2 rounded-xl font-bold transition-colors shadow-sm w-full md:w-auto"
                    >
                        <Printer className="h-4 w-4" />
                        Print / Gem PDF
                    </button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print-header mb-8">
                <h1 className="text-2xl font-bold text-black">Lagerrapport - {formatMonth(currentDate)}</h1>
            </div>

            {/* Main Content Container */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* SCREEN VIEW (Hidden during print) */}
                <div className="print:hidden">
                    {/* Desktop Table */}
                    <div className="hidden md:block relative overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-900 shadow-sm">
                                <tr className="text-xs uppercase tracking-wider h-12 border-b border-gray-100 dark:border-gray-700">
                                    <th className="p-4 font-bold sticky left-0 bg-gray-50 dark:bg-gray-900 z-50 text-gray-700 dark:text-gray-300 min-w-[200px]">Publikation</th>
                                    <th className="p-4 text-center text-red-700 dark:text-red-400 font-black border-l border-gray-100 dark:border-gray-800" colSpan="3">Dansk</th>
                                    <th className="p-4 text-center text-blue-700 dark:text-blue-400 font-black border-l border-gray-100 dark:border-gray-800" colSpan="3">Norsk</th>
                                    <th className="p-4 text-center text-yellow-700 dark:text-yellow-600 font-black border-l border-gray-100 dark:border-gray-800" colSpan="3">Svensk</th>
                                    <th className="p-4 text-right font-black text-gray-900 dark:text-white border-l border-gray-100 dark:border-gray-800">Total</th>
                                </tr>
                                <tr className="text-[10px] font-bold h-10 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                    <th className="p-2 sticky left-0 bg-gray-50 dark:bg-gray-900 z-50"></th>
                                    {/* DK */}
                                    <th className="p-2 text-center text-gray-500 border-l border-gray-50/50">Skab</th>
                                    <th className="p-2 text-center text-gray-500">Lager</th>
                                    <th className="p-2 text-center font-black text-red-600 bg-red-50/20">Alt</th>
                                    {/* NO */}
                                    <th className="p-2 text-center text-gray-500 border-l border-gray-50/50">Skab</th>
                                    <th className="p-2 text-center text-gray-500">Lager</th>
                                    <th className="p-2 text-center font-black text-blue-600 bg-blue-50/20">Alt</th>
                                    {/* SE */}
                                    <th className="p-2 text-center text-gray-500 border-l border-gray-50/50">Skab</th>
                                    <th className="p-2 text-center text-gray-500">Lager</th>
                                    <th className="p-2 text-center font-black text-yellow-600 bg-yellow-50/20">Alt</th>
                                    <th className="p-2 border-l border-gray-50/50 space-y-0"></th>
                                </tr>
                            </thead>
                            {(() => {
                                const customOrder = ['Bibler', 'Bøger', 'Brochurer', 'Foldere', 'Offentlige blade'];
                                const sortSections = (a, b) => {
                                    const indexA = customOrder.indexOf(a);
                                    const indexB = customOrder.indexOf(b);
                                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                                    if (indexA !== -1) return -1;
                                    if (indexB !== -1) return 1;
                                    return a.localeCompare(b);
                                };

                                return [...new Set(reportData.map(i => i.section).filter(Boolean))].sort(sortSections).map(sectionName => {
                                    const sectionItems = reportData.filter(i => i.section === sectionName);
                                    return (
                                        <tbody key={sectionName} className="divide-y divide-gray-50 dark:divide-gray-800">
                                            <tr className="bg-gray-50/30 dark:bg-white/5">
                                                <td colSpan="11" className="px-4 py-2 font-black text-blue-600 dark:text-blue-400 text-[10px] uppercase tracking-widest border-y border-gray-100 dark:border-gray-800">
                                                    {sectionName}
                                                </td>
                                            </tr>
                                            {sectionItems.map((item) => (
                                                <tr key={item.code} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                                    <td className="p-4 sticky left-0 bg-white dark:bg-gray-800 z-10 group-hover:bg-gray-50 dark:group-hover:bg-white/5 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                        <div className="font-bold text-gray-900 dark:text-white leading-tight">{item.name_da}</div>
                                                        <div className="text-xs text-gray-400 mt-1 font-mono uppercase">{item.code}</div>
                                                    </td>
                                                    <td className="p-4 text-center text-gray-500 text-sm">{item.dk.skab || 0}</td>
                                                    <td className="p-4 text-center text-gray-500 text-sm">{item.dk.lager || 0}</td>
                                                    <td className="p-4 text-center font-bold text-red-600 bg-red-50/30 dark:bg-red-900/10">{item.dk.total || 0}</td>
                                                    <td className="p-4 text-center text-gray-500 text-sm">{item.no.skab || 0}</td>
                                                    <td className="p-4 text-center text-gray-500 text-sm">{item.no.lager || 0}</td>
                                                    <td className="p-4 text-center font-bold text-blue-600 bg-blue-50/30 dark:bg-blue-900/10">{item.no.total || 0}</td>
                                                    <td className="p-4 text-center text-gray-500 text-sm">{item.se.skab || 0}</td>
                                                    <td className="p-4 text-center text-gray-500 text-sm">{item.se.lager || 0}</td>
                                                    <td className="p-4 text-center font-bold text-yellow-600 bg-yellow-50/30 dark:bg-yellow-900/10">{item.se.total || 0}</td>
                                                    <td className="p-4 text-right font-black text-gray-900 dark:text-white bg-gray-50/50 dark:bg-white/5 border-l border-gray-100 dark:border-gray-800">
                                                        {item.grandTotal}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    );
                                });
                            })()}
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden">
                        {(() => {
                            const customOrder = ['Bibler', 'Bøger', 'Brochurer', 'Foldere', 'Offentlige blade'];
                            const sortSections = (a, b) => {
                                const indexA = customOrder.indexOf(a);
                                const indexB = customOrder.indexOf(b);
                                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                                if (indexA !== -1) return -1;
                                if (indexB !== -1) return 1;
                                return a.localeCompare(b);
                            };

                            return [...new Set(reportData.map(i => i.section).filter(Boolean))].sort(sortSections).map(sectionName => {
                                const sectionItems = reportData.filter(i => i.section === sectionName);
                                return (
                                    <React.Fragment key={sectionName}>
                                        <div className="bg-gray-50 dark:bg-gray-800 p-3 border-y border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-200 text-sm uppercase">
                                            {sectionName}
                                        </div>
                                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {sectionItems.map((item) => (
                                                <div key={item.code} className="p-4 even:bg-gray-50/50 dark:even:bg-white/5">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex-1">
                                                            <div className="font-bold text-gray-900 dark:text-white text-lg">{item.name_da}</div>
                                                            <div className="text-sm text-gray-500 font-mono">{item.code}</div>
                                                        </div>
                                                        <div className="text-right ml-4">
                                                            <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Total</div>
                                                            <div className="font-black text-2xl text-blue-600 dark:text-blue-400 leading-none">{item.grandTotal}</div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-2 border-t border-gray-100 dark:border-gray-700 pt-3 mt-1">
                                                        {[{ l: 'Dansk', v: item.dk, c: 'text-red-600' }, { l: 'Norsk', v: item.no, c: 'text-blue-600' }, { l: 'Svensk', v: item.se, c: 'text-yellow-600' }].map(r => (
                                                            <div key={r.l} className="flex justify-between items-center text-sm py-1">
                                                                <span className={`font-bold ${r.c}`}>{r.l}</span>
                                                                <div className="flex gap-3 text-gray-500 dark:text-gray-400">
                                                                    <span>Skab: {r.v.skab || 0}</span>
                                                                    <span>Lager: {r.v.lager || 0}</span>
                                                                    <span className="font-bold text-gray-900 dark:text-white ml-1">Alt: {r.v.total || 0}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </React.Fragment>
                                );
                            });
                        })()}
                    </div>
                </div>

                {/* PRINT VIEW (Hidden on screen) */}
                <div className="hidden print:block w-full">
                    <div className="mb-4 text-xs font-medium text-gray-600 italic">
                        Totals pr. kode (NO/DA/SV samlet hver for sig).
                    </div>
                    <table className="w-full text-left border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100 border-b border-gray-300 text-[9px] uppercase tracking-wider font-extrabold text-gray-700">
                                <th className="p-2 border-r border-gray-300">SEKTION</th>
                                <th className="p-2 border-r border-gray-300">KODE</th>
                                <th className="p-2 text-center border-r border-gray-300">NO</th>
                                <th className="p-2 text-center border-r border-gray-300">DA</th>
                                <th className="p-2 text-center border-r border-gray-300">SV</th>
                                <th className="p-2 text-right">I ALT</th>
                            </tr>
                        </thead>
                        {(() => {
                            const customOrder = ['Bibler', 'Bøger', 'Brochurer', 'Foldere', 'Offentlige blade'];
                            const sortSections = (a, b) => {
                                const indexA = customOrder.indexOf(a);
                                const indexB = customOrder.indexOf(b);
                                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                                if (indexA !== -1) return -1;
                                if (indexB !== -1) return 1;
                                return a.localeCompare(b);
                            };

                            return [...new Set(reportData.map(i => i.section).filter(Boolean))].sort(sortSections).map(sectionName => {
                                const sectionItems = reportData.filter(i => i.section === sectionName);
                                return (
                                    <tbody key={sectionName} className="border-b-2 border-gray-300">
                                        <tr className="bg-gray-100">
                                            <td colSpan="6" className="p-2 font-black text-black text-sm uppercase tracking-widest border-b border-gray-300">
                                                {sectionName}
                                            </td>
                                        </tr>
                                        {sectionItems.map((item) => (
                                            <tr key={item.code} className="even:bg-gray-50 border-b border-gray-200 last:border-none">
                                                <td className="p-2 border-r border-gray-200"></td> {/* SECTION NAME REMOVED AS REQUESTED */}
                                                <td className="p-2 text-xs font-bold text-black border-r border-gray-200">{item.code}</td>
                                                <td className="p-2 text-center text-xs font-medium text-black border-r border-gray-200">{item.no.total || 0}</td>
                                                <td className="p-2 text-center text-xs font-medium text-black border-r border-gray-200">{item.dk.total || 0}</td>
                                                <td className="p-2 text-center text-xs font-medium text-black border-r border-gray-200">{item.se.total || 0}</td>
                                                <td className="p-2 text-right text-xs font-black text-black bg-gray-50">{item.grandTotal}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                );
                            });
                        })()}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
