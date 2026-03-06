import React, { useState, useEffect } from 'react';
import { ShoppingCart, Send, Package, Globe, MessageSquare, Plus, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStats } from '../context/StatsContext';

const CreateOrder = () => {
    const { user } = useAuth();
    const { refreshStats } = useStats();
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [selectedItem, setSelectedItem] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [language, setLanguage] = useState('Dansk');
    const [isExtra, setIsExtra] = useState(false);
    const [customTitle, setCustomTitle] = useState('');
    const [customCode, setCustomCode] = useState('');
    const [comment, setComment] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' or 'other'

    const scandinavianLanguages = ['Dansk', 'Norsk', 'Svensk'];
    const europeanLanguages = [
        'Dansk', 'Norsk', 'Svensk', 'Engelsk', 'Tysk', 'Fransk', 'Spansk', 'Italiensk',
        'Hollandsk', 'Portugisisk', 'Polsk', 'Rumænsk', 'Græsk', 'Ungarsk', 'Tjekkisk',
        'Bulgarsk', 'Finsk', 'Slovakisk', 'Litauisk', 'Kroatisk', 'Slovensk', 'Estisk',
        'Lettisk', 'Irsk', 'Maltesisk', 'Ukrainsk', 'Russisk', 'Andet'
    ];

    // Use europeanLanguages for everything now
    useEffect(() => {
        // No longer resetting language to 'Dansk' automatically based on isExtra
        // since we allow all languages for all items now.
    }, [isExtra]);

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                const res = await fetch(`/api/catalog?role=${user?.role}`);
                if (res.ok) {
                    const data = await res.json();
                    setCatalog(data);
                }
            } catch (err) {
                console.error("Failed to fetch catalog", err);
            }
            setLoading(false);
        };
        fetchCatalog();
    }, [user]);

    const stripSuffix = (code) => {
        if (!code) return '';
        // Removes common language suffixes like -d, -n, -z
        return code.replace(/-(d|n|z)$|-[a-z]$/i, '');
    };

    const getSuffix = (lang) => {
        switch (lang) {
            case 'Norsk': return '-n';
            case 'Svensk': return '-z';
            case 'Dansk': return '-d';
            default: return ''; // No suffix for other languages
        }
    };

    const getNameForLanguage = (item, lang) => {
        switch (lang) {
            case 'Norsk': return item.name_no || item.name_da;
            case 'Svensk': return item.name_sv || item.name_da;
            default: return item.name_da;
        }
    };

    const getRegionForLanguage = (lang) => {
        switch (lang) {
            case 'Norsk': return { region: 'no', region_name: 'Norsk' };
            case 'Svensk': return { region: 'sv', region_name: 'Svensk' };
            default: return { region: 'da', region_name: 'Dansk' };
        }
    };

    const filteredCatalog = catalog.filter(item =>
        item.name_da.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);

    const customFilteredCatalog = catalog.filter(item => {
        const titleMatch = customTitle && item.name_da.toLowerCase().includes(customTitle.toLowerCase());
        const codeMatch = customCode && item.code.toLowerCase().includes(customCode.toLowerCase());
        return titleMatch || codeMatch;
    }).slice(0, 5);

    const handleSelectSuggestion = (item) => {
        if (isExtra) {
            setCustomTitle(stripSuffix(item.name_da));
            setCustomCode(stripSuffix(item.code));
            // Vi bliver på fanen "Anden Publikation" som ønsket
        } else {
            setSelectedItem(item);
            setSearchTerm(''); // Tøm søgefeltet når man har valgt, som ønsket
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const finalCode = isExtra ? customCode : `${stripSuffix(selectedItem?.code)}${getSuffix(language)}`;
        const { region, region_name } = getRegionForLanguage(language);

        const orderData = {
            catalog_id: isExtra ? null : selectedItem?.id,
            code: finalCode,
            name: isExtra ? customTitle : (
                ['Dansk', 'Norsk', 'Svensk'].includes(language)
                    ? getNameForLanguage(selectedItem, language)
                    : stripSuffix(getNameForLanguage(selectedItem, language))
            ),
            region,
            region_name,
            quantity: parseInt(quantity),
            language,
            comment,
            is_extra: isExtra,
            currentUserRole: user?.role,
            currentUsername: user?.full_name || user?.username
        };

        try {
            const res = await fetch('/api/ordered/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (res.ok) {
                setSuccess(true);
                refreshStats();
                // Reset form
                setSelectedItem(null);
                setQuantity(1);
                setCustomTitle('');
                setCustomCode('');
                setComment('');
                setTimeout(() => setSuccess(false), 5000);
            } else {
                const data = await res.json();
                setError(data.error || 'Der opstod en fejl.');
            }
        } catch (err) {
            setError('Netværksfejl.');
        }
        setSubmitting(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (user?.role === 'viewer') return (
        <div className="p-8 max-w-2xl mx-auto text-center">
            <div className="bg-amber-50 dark:bg-amber-900/20 p-8 rounded-3xl border border-amber-100 dark:border-amber-800">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Adgang Nægtet</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Læse-brugere har ikke tilladelse til at bestille publikationer.
                </p>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <ShoppingCart className="h-8 w-8 text-blue-600" />
                    Bestil Publikationer
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Her kan du bestille publikationer. Din anmodning skal godkendes af administratoren.
                </p>
            </div>

            {success && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 rounded-2xl flex items-center gap-3 text-green-700 dark:text-green-300 animate-in slide-in-from-top-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-bold">Anmodning er sendt til godkendelse!</p>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-300">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-bold">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex gap-4 mb-6">
                        <button
                            type="button"
                            onClick={() => setIsExtra(false)}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${!isExtra
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'bg-gray-50 dark:bg-gray-900 text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            Fra Katalog
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsExtra(true)}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${isExtra
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'bg-gray-50 dark:bg-gray-900 text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            Anden Publikation
                        </button>
                    </div>

                    {!isExtra ? (
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Vælg Publikation</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Søg i kataloget..."
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {selectedItem ? (
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-xl flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{stripSuffix(selectedItem.name_da)}</p>
                                        <p className="text-xs text-gray-500 font-mono">{stripSuffix(selectedItem.code)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedItem(null)}
                                        className="text-xs font-bold text-blue-600 hover:underline"
                                    >
                                        Skift
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {filteredCatalog.map(item => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setSelectedItem(item)}
                                            className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors flex items-center gap-3 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                                        >
                                            <Package className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{stripSuffix(item.name_da)}</p>
                                                <p className="text-[10px] font-mono text-gray-400">{stripSuffix(item.code)}</p>
                                            </div>
                                        </button>
                                    ))}
                                    {searchTerm && filteredCatalog.length === 0 && (
                                        <p className="text-center py-4 text-gray-400 italic text-sm">Ingen publikationer fundet.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Titel / Navn</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="F.eks. 'Glæd dig over livet forever'"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                    value={customTitle}
                                    onChange={(e) => setCustomTitle(e.target.value)}
                                />
                                {isExtra && customTitle && customFilteredCatalog.length > 0 && (
                                    <div className="mt-2 p-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100/50 dark:border-blue-800/30 space-y-1">
                                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 px-2 uppercase tracking-wider">Mener du en af disse fra kataloget?</p>
                                        {customFilteredCatalog.map(item => (
                                            <button
                                                key={`suggest-title-${item.id}`}
                                                type="button"
                                                onClick={() => handleSelectSuggestion(item)}
                                                className="w-full text-left p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-between group"
                                            >
                                                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">{stripSuffix(item.name_da)}</span>
                                                <span className="text-[10px] font-mono text-gray-400">{stripSuffix(item.code)}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Kode (valgfri)</label>
                                <input
                                    type="text"
                                    placeholder="F.eks. 'lff'"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                    value={customCode}
                                    onChange={(e) => setCustomCode(e.target.value)}
                                />
                                {isExtra && customCode && customFilteredCatalog.length > 0 && (
                                    <div className="mt-2 p-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100/50 dark:border-blue-800/30 space-y-1">
                                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 px-2 uppercase tracking-wider">Match fundet i kataloget:</p>
                                        {customFilteredCatalog.map(item => (
                                            <button
                                                key={`suggest-code-${item.id}`}
                                                type="button"
                                                onClick={() => handleSelectSuggestion(item)}
                                                className="w-full text-left p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-between group"
                                            >
                                                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">{stripSuffix(item.name_da)}</span>
                                                <span className="text-[10px] font-mono text-gray-400">{stripSuffix(item.code)}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Antal</label>
                            <div className="relative">
                                <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-bold"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Sprog</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <select
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white font-bold appearance-none shadow-sm"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                >
                                    {europeanLanguages.map(lang => (
                                        <option key={lang}>{lang}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Kommentar (valgfri)</label>
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <textarea
                                rows="3"
                                placeholder="Evt. noter til bestillingen..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting || (!isExtra && !selectedItem)}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-3xl font-black text-lg transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98]"
                >
                    {submitting ? (
                        <div className="h-6 w-6 border-b-2 border-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <Send className="h-6 w-6" />
                            <span>Send Bestilling</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default CreateOrder;
