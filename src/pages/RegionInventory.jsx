import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Filter, ChevronLeft, ChevronRight, Calendar, Loader, MessageSquare, X } from 'lucide-react';

const RegionInventory = () => {
    const { region } = useParams();
    const { user } = useAuth();

    // Date State (Init from sessionStorage/localStorage or previous month)
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

    const getMonthKey = (date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    };

    const formatMonth = (date) => {
        return date.toLocaleDateString('da-DK', { year: 'numeric', month: 'long' });
    };

    const currentMonthKey = getMonthKey(currentDate);

    // Calculate previous month key for comparison
    const prevDate = new Date(currentDate);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonthKey = getMonthKey(prevDate);
    const prevMonthName = prevDate.toLocaleDateString('da-DK', { month: 'short' });

    const [items, setItems] = useState([]);
    const [prevItems, setPrevItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeSection, setActiveSection] = useState('Alle');

    // Determine which name field to use based on region
    const getNameField = (region) => {
        switch (region) {
            case 'norsk': return 'name_no';
            case 'svensk': return 'name_sv';
            case 'dansk': default: return 'name_da';
        }
    };

    const fetchInventory = useCallback(async (monthKey, setFunction) => {
        try {
            const res = await fetch(`/api/inventory/${region}/${monthKey}`);
            if (res.ok) {
                const data = await res.json();
                setFunction(data);
                return data;
            }
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        }
        setFunction([]);
        return [];
    }, [region]);

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);

            // Fetch Catalog Definitions from API
            let catalogItems = [];
            try {
                const catalogRes = await fetch(`/api/catalog?role=${user?.role}`);
                if (catalogRes.ok) {
                    catalogItems = await catalogRes.json();
                } else {
                    console.error("Failed to fetch catalog");
                }
            } catch (err) {
                console.error("Error fetching catalog", err);
            }

            // Fetch Previous Month
            await fetchInventory(prevMonthKey, setPrevItems);

            // Fetch Current Month
            const currentData = await fetchInventory(currentMonthKey, () => { });

            // Merge with Catalog
            const nameField = getNameField(region);

            const mergedItems = catalogItems.map((item) => {
                const found = currentData?.find(i => i.item_code === item.code);

                // Defaults
                let skab = 0;
                let lager = 0;
                let total = 0;

                // If found in DB, use DB values
                if (found) {
                    skab = found.skab;
                    lager = found.lager;
                    total = found.total;
                } else if (currentMonthKey === '2026-01') {
                    // Special Seed for Jan 2026
                    let qtyField = 'quantity_da';
                    if (region === 'norsk') qtyField = 'quantity_no';
                    if (region === 'svensk') qtyField = 'quantity_sv';
                    lager = item[qtyField] || 0;
                    total = lager;
                }

                return {
                    code: item.code,
                    name: item[nameField],
                    section: item.section,
                    skab,
                    lager,
                    total,
                    description: item.description || '',
                    note: found?.note || '',
                    quantity_da: item.quantity_da,
                    quantity_no: item.quantity_no,
                    quantity_sv: item.quantity_sv
                };
            });

            setItems(mergedItems);
            setLoading(false);
        };

        loadData();
    }, [region, currentMonthKey, prevMonthKey, fetchInventory]);

    const handleUpdateItem = async (code, field, value) => {
        if (user?.role === 'user' || user?.role === 'viewer') return;
        const newItems = items.map(item => {
            if (item.code === code) {
                const updates = { ...item, [field]: value };
                if (field === 'skab' || field === 'lager') {
                    const skab = field === 'skab' ? (parseInt(value) || 0) : (item.skab || 0);
                    const lager = field === 'lager' ? (parseInt(value) || 0) : (item.lager || 0);
                    updates.total = skab + lager;
                }
                return updates;
            }
            return item;
        });
        setItems(newItems);

        const updatedItem = newItems.find(i => i.code === code);
        try {
            await fetch('/api/inventory/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    region,
                    month_key: currentMonthKey,
                    item_code: code,
                    skab: updatedItem.skab,
                    lager: updatedItem.lager,
                    total: updatedItem.total,
                    note: updatedItem.note,
                    userRole: user?.role
                })
            });
        } catch (error) {
            console.error("Failed to save update", error);
        }
    };

    const isAndreItem = (code) => code && code.toLowerCase().includes('andre');

    const handleNoteChange = (code, value) => {
        setItems(prevItems => prevItems.map(item =>
            item.code === code ? { ...item, note: value } : item
        ));
    };

    const handleNoteSave = async (code) => {
        if (user?.role === 'viewer') return;
        const item = items.find(i => i.code === code);
        if (!item) return;

        try {
            await fetch('/api/inventory/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    region,
                    month_key: currentMonthKey,
                    item_code: code,
                    skab: item.skab,
                    lager: item.lager,
                    total: item.total,
                    note: item.note
                })
            });
        } catch (error) {
            console.error("Failed to save note", error);
        }
    };

    const regionName = region ? region.charAt(0).toUpperCase() + region.slice(1) : '';

    // Region color theme
    const regionColors = {
        dansk: {
            accent: 'text-red-600 dark:text-red-400',
            dot: 'bg-red-500',
            pillActive: 'bg-red-600 text-white shadow-md shadow-red-200 dark:shadow-none',
            sectionText: 'text-red-700 dark:text-red-400',
            focusRing: 'focus:ring-red-500 focus:border-red-500',
            totalColor: 'text-red-600 dark:text-red-400',
            headerBar: 'from-red-500/10 to-transparent dark:from-red-500/5',
        },
        norsk: {
            accent: 'text-blue-600 dark:text-blue-400',
            dot: 'bg-blue-500',
            pillActive: 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none',
            sectionText: 'text-blue-700 dark:text-blue-400',
            focusRing: 'focus:ring-blue-500 focus:border-blue-500',
            totalColor: 'text-blue-600 dark:text-blue-400',
            headerBar: 'from-blue-500/10 to-transparent dark:from-blue-500/5',
        },
        svensk: {
            accent: 'text-yellow-600 dark:text-yellow-400',
            dot: 'bg-yellow-500',
            pillActive: 'bg-yellow-500 text-white shadow-md shadow-yellow-200 dark:shadow-none',
            sectionText: 'text-yellow-700 dark:text-yellow-500',
            focusRing: 'focus:ring-yellow-500 focus:border-yellow-500',
            totalColor: 'text-yellow-600 dark:text-yellow-500',
            headerBar: 'from-yellow-500/10 to-transparent dark:from-yellow-500/5',
        },
    };
    const rc = regionColors[region] || regionColors.dansk;

    const sortSections = useCallback((a, b) => {
        const customOrder = ['Bibler', 'Bøger', 'Brochurer', 'Foldere', 'Offentlige blade'];
        if (a === 'Alle') return -1;
        if (b === 'Alle') return 1;
        const indexA = customOrder.indexOf(a);
        const indexB = customOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    }, []);

    const sections = ['Alle', ...[...new Set(items.map(i => i.section).filter(Boolean))].sort(sortSections)];

    const filteredItems = items.filter(i => {
        const matchesSection = activeSection === 'Alle' || i.section === activeSection;
        const searchLower = search.toLowerCase();
        return matchesSection && (search === '' ||
            (i.code && i.code.toLowerCase().includes(searchLower)) ||
            (i.name && i.name.toLowerCase().includes(searchLower)) ||
            (i.description && i.description.toLowerCase().includes(searchLower)));
    });

    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
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
        <div className="p-4 md:p-8 max-w-7xl mx-auto transition-colors duration-200">
            {/* Subtle gradient header bar */}
            <div className={`-mx-4 md:-mx-8 -mt-4 md:-mt-8 px-4 md:px-8 pt-4 md:pt-8 pb-2 mb-4 bg-gradient-to-b ${rc.headerBar}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className={`text-2xl md:text-3xl font-black flex items-center gap-3 ${rc.accent}`}>
                            {regionName} Lager
                        </h1>
                        <div className="flex items-center mt-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${rc.dot} mr-2`} />
                            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Lageroptælling</p>
                            {user?.role === 'viewer' && (
                                <span className="ml-3 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase rounded-md border border-amber-200 dark:border-amber-800 flex items-center">
                                    <Filter className="h-3 w-3 mr-1" /> Skrivebeskyttet
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1.5 w-full md:w-auto">
                        <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => {
                                const today = new Date();
                                const inventoryMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                                setCurrentDate(inventoryMonth);
                                const monthKey = inventoryMonth.toISOString().slice(0, 7);
                                localStorage.setItem('selectedMonth', monthKey);
                            }}
                            className="flex items-center px-4 space-x-2 font-bold text-gray-700 dark:text-gray-200 flex-1 md:w-48 justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer py-2"
                        >
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span className="capitalize whitespace-nowrap">{formatMonth(currentDate)}</span>
                        </button>
                        <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex flex-wrap gap-2">
                    {sections.map(section => (
                        <button
                            key={section}
                            onClick={() => setActiveSection(section)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeSection === section
                                ? rc.pillActive
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            {section}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Søg i publikationer..."
                        className="pl-10 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Desktop Table — hidden on mobile */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                <div className="relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-30">
                            <tr className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wider h-12">
                                <th className="p-4 font-bold sticky top-0 left-0 bg-gray-50 dark:bg-gray-900 z-50 border-none h-20" rowSpan="2">Publikation</th>
                                <th className="p-4 font-semibold text-center hidden md:table-cell border-none">Skab</th>
                                <th className="p-4 font-semibold text-center hidden md:table-cell border-none">Lager</th>
                                <th className="p-4 font-semibold text-right font-bold text-gray-800 dark:text-white hidden md:table-cell border-none">I Alt</th>
                                <th className="p-4 font-semibold text-center w-24 md:w-32 border-none">Skab</th>
                                <th className="p-4 font-semibold text-center w-24 md:w-32 border-none">Lager</th>
                                <th className="p-4 font-semibold text-right font-bold text-gray-800 dark:text-white border-none">I Alt</th>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-900 h-8">
                                <th className="px-4 pb-2 text-center text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500 hidden md:table-cell border-none" colSpan="3">
                                    Sidste Måned ({prevMonthName})
                                </th>
                                <th className="border-none" colSpan="3"></th>
                            </tr>
                        </thead>
                        {(() => {
                            const sectionsToRender = activeSection === 'Alle'
                                ? [...new Set(filteredItems.map(i => i.section || 'Andet'))].sort(sortSections)
                                : [activeSection];

                            return sectionsToRender.map(sectionName => {
                                const sectionItems = filteredItems.filter(i => (i.section || 'Andet') === sectionName);
                                if (sectionItems.length === 0) return null;

                                return (
                                    <tbody key={sectionName} className="divide-y divide-gray-50 dark:divide-gray-700">
                                        <tr className="sticky top-[80px] z-10 font-bold">
                                            <td colSpan={10} className={`px-6 py-3 font-black ${rc.sectionText} text-sm uppercase tracking-wider bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm`}>
                                                {sectionName}
                                            </td>
                                        </tr>
                                        {sectionItems.map((item) => {
                                            let prev = prevItems.find(p => p.item_code === item.code);
                                            if (!prev && prevMonthKey === '2026-01') {
                                                let qtyField = 'quantity_da';
                                                if (region === 'norsk') qtyField = 'quantity_no';
                                                if (region === 'svensk') qtyField = 'quantity_sv';
                                                const val = item[qtyField] || 0;
                                                prev = { skab: 0, lager: val, total: val };
                                            }
                                            prev = prev || { skab: 0, lager: 0, total: 0 };

                                            return (
                                                <tr key={item.code} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                                                    <td className="p-4 pl-6">
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{item.code}</div>
                                                        {item.description && <div className="text-xs text-blue-500/70 dark:text-blue-400/70 mt-0.5">{item.description}</div>}
                                                        {isAndreItem(item.code) && (user?.role === 'admin' || user?.role === 'superuser') && (
                                                            <input
                                                                type="text"
                                                                value={item.note || ''}
                                                                onChange={(e) => handleNoteChange(item.code, e.target.value)}
                                                                onBlur={() => handleNoteSave(item.code)}
                                                                placeholder="Skriv hvilke publikationer..."
                                                                disabled={user?.role === 'viewer'}
                                                                className="mt-1.5 w-full text-sm px-2.5 py-1 border border-amber-200 dark:border-amber-800/50 rounded-md bg-amber-50/50 dark:bg-amber-900/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-400 outline-none disabled:opacity-50 transition-all"
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-center text-gray-400 dark:text-gray-600 bg-gray-50/30 dark:bg-gray-800/30 border-l border-gray-100/50 dark:border-gray-700/50 hidden md:table-cell">
                                                        {prev.skab || 0}
                                                    </td>
                                                    <td className="p-4 text-center text-gray-400 dark:text-gray-600 bg-gray-50/30 dark:bg-gray-800/30 hidden md:table-cell">
                                                        {prev.lager || 0}
                                                    </td>
                                                    <td className="p-4 text-right font-medium text-gray-600 dark:text-gray-400 bg-gray-50/30 dark:bg-gray-800/30 border-r border-gray-100/50 dark:border-gray-700/50 hidden md:table-cell">
                                                        {prev.total || 0}
                                                    </td>
                                                    <td className="p-4 border-l border-white dark:border-gray-700">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={item.skab === 0 ? '' : item.skab}
                                                            onChange={(e) => handleUpdateItem(item.code, 'skab', parseInt(e.target.value) || 0)}
                                                            placeholder="0"
                                                            disabled={user?.role === 'user' || user?.role === 'viewer'}
                                                            className="w-full text-center p-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={item.lager === 0 ? '' : item.lager}
                                                            onChange={(e) => handleUpdateItem(item.code, 'lager', parseInt(e.target.value) || 0)}
                                                            placeholder="0"
                                                            disabled={user?.role === 'user' || user?.role === 'viewer'}
                                                            className="w-full text-center p-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        />
                                                    </td>
                                                    <td className="p-4 text-right font-bold text-gray-900 dark:text-white text-lg">
                                                        {item.total || 0}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                );
                            });
                        })()}
                    </table>
                </div>
            </div>

            {/* Mobile Card Layout — hidden on desktop */}
            <div className="md:hidden space-y-0">
                {(() => {
                    const sectionsToRender = activeSection === 'Alle'
                        ? [...new Set(filteredItems.map(i => i.section || 'Andet'))].sort(sortSections)
                        : [activeSection];

                    return sectionsToRender.map(sectionName => {
                        const sectionItems = filteredItems.filter(i => (i.section || 'Andet') === sectionName);
                        if (sectionItems.length === 0) return null;

                        return (
                            <React.Fragment key={sectionName}>
                                {/* Section Header */}
                                <div className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-900 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
                                    <span className={`font-black ${rc.sectionText} text-xs uppercase tracking-widest`}>{sectionName}</span>
                                </div>

                                {/* Item Cards */}
                                {sectionItems.map((item) => (
                                    <div key={item.code} className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700/50 px-4 py-4">
                                        {/* Item Header */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 min-w-0 mr-3">
                                                <div className="font-bold text-gray-900 dark:text-white text-[15px] leading-tight truncate">{item.name}</div>
                                                <div className="text-[11px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">{item.code}</div>
                                                {isAndreItem(item.code) && (user?.role === 'admin' || user?.role === 'superuser') && (
                                                    <input
                                                        type="text"
                                                        value={item.note || ''}
                                                        onChange={(e) => handleNoteChange(item.code, e.target.value)}
                                                        onBlur={() => handleNoteSave(item.code)}
                                                        placeholder="Skriv hvilke publikationer..."
                                                        disabled={user?.role === 'viewer'}
                                                        className="mt-1.5 w-full text-sm px-2.5 py-1 border border-amber-200 dark:border-amber-800/50 rounded-md bg-amber-50/50 dark:bg-amber-900/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-400 outline-none disabled:opacity-50 transition-all"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end shrink-0">
                                                <div className="text-[10px] uppercase text-gray-400 dark:text-gray-500 font-bold tracking-wider">I Alt</div>
                                                <div className="text-2xl font-black text-gray-900 dark:text-white leading-none">{item.total || 0}</div>
                                            </div>
                                        </div>

                                        {/* Inline Edit Row */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider mb-1 block">Skab</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    inputMode="numeric"
                                                    value={item.skab === 0 ? '' : item.skab}
                                                    onChange={(e) => handleUpdateItem(item.code, 'skab', parseInt(e.target.value) || 0)}
                                                    placeholder="0"
                                                    disabled={user?.role === 'user' || user?.role === 'viewer'}
                                                    className={`w-full text-center py-2.5 px-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 ${rc.focusRing} outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-bold placeholder-gray-300 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider mb-1 block">Lager</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    inputMode="numeric"
                                                    value={item.lager === 0 ? '' : item.lager}
                                                    onChange={(e) => handleUpdateItem(item.code, 'lager', parseInt(e.target.value) || 0)}
                                                    placeholder="0"
                                                    disabled={user?.role === 'user' || user?.role === 'viewer'}
                                                    className={`w-full text-center py-2.5 px-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 ${rc.focusRing} outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-bold placeholder-gray-300 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                                                />
                                            </div>
                                            <div className="w-16 text-center">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider mb-1 block">Total</label>
                                                <div className={`py-2.5 text-xl font-black ${rc.totalColor}`}>{item.total || 0}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </React.Fragment>
                        );
                    });
                })()}
            </div>
        </div>
    );
};

export default RegionInventory;
