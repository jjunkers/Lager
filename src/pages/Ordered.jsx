import React, { useState, useEffect } from 'react';
import { Package, CheckCircle2, Loader2, Search, ArrowRight, AlertCircle, RefreshCcw, ShoppingCart, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStats } from '../context/StatsContext';

const Ordered = () => {
    const { user } = useAuth();
    const { refreshStats } = useStats();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [receivingItem, setReceivingItem] = useState(null);
    const [receivedQuantity, setReceivedQuantity] = useState(0);
    const [error, setError] = useState(null);

    const fetchOrderedItems = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/ordered?role=${user?.role}`);
            if (res.ok) {
                const data = await res.json();
                // Kun vis godkendte publikationer her
                setItems(data.filter(i => i.approved === 1));
            } else {
                setError('Kunne ikke hente bestilte publikationer');
            }
        } catch (error) {
            console.error("Failed to load ordered items", error);
            setError('Netværksfejl ved hentning af publikationer');
        }
        setLoading(false);
    };

    const handleUpdateStatus = async (item, nextStatus) => {
        setProcessingId(item.id);
        try {
            const res = await fetch('/api/ordered/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: item.id,
                    status: nextStatus,
                    currentUserRole: user?.role
                })
            });

            if (res.ok) {
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: nextStatus } : i));
            } else {
                alert('Der opstod en fejl ved opdatering af status.');
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
        setProcessingId(null);
    };

    const handleReceiveClick = (item) => {
        setReceivingItem(item);
        setReceivedQuantity(item.quantity);
    };

    const confirmReceive = async () => {
        if (!receivingItem) return;

        console.log("Confirming receipt for item:", receivingItem, "with quantity:", receivedQuantity);
        setProcessingId(receivingItem.id);
        try {
            const res = await fetch('/api/ordered', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: receivingItem.id,
                    catalog_id: receivingItem.catalog_id,
                    region: receivingItem.region,
                    quantity: parseInt(receivedQuantity),
                    currentUserRole: user?.role
                })
            });

            if (res.ok) {
                console.log("Item received successfully");
                setItems(prev => prev.filter(i => i.id !== receivingItem.id));
                setReceivingItem(null);
                refreshStats();
            } else {
                const data = await res.json();
                console.error("Failed to receive item:", data);
                alert(`Fejl ved modtagelse: ${data.error || 'Ukendt fejl'}`);
            }
        } catch (error) {
            console.error("Network error during receive:", error);
            alert('Netværksfejl ved modtagelse af publikationen.');
        }
        setProcessingId(null);
    };

    useEffect(() => {
        fetchOrderedItems();
    }, []);

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.region_name && item.region_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getStatusInfo = (status) => {
        switch (status) {
            case 'Bestilling': return { label: 'Skal Bestilles', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', step: 1 };
            case 'Bestilt': return { label: 'Bestilt v/ HQ', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', step: 2 };
            case 'Afhentes': return { label: 'Klar til Afhentning', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', step: 3 };
            default: return { label: status, color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', step: 0 };
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center">
                        <Package className="mr-3 h-8 w-8 text-blue-600" />
                        Bestilte Publikationer & Tracking
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 font-medium">
                        Følg dine bestillinger fra anmodning til hylde.
                    </p>
                </div>
                <button
                    onClick={fetchOrderedItems}
                    className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors"
                >
                    <RefreshCcw className="h-5 w-5 text-gray-400" />
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Søg i bestilte publikationer..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
                    <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Ingen publikationer i tracking-flowet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map(item => {
                        const statusInfo = getStatusInfo(item.status);
                        return (
                            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group overflow-hidden relative">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${item.region === 'da' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' :
                                                (item.region === 'sv' || item.region === 'z') ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20' :
                                                    'bg-blue-50 text-blue-600 dark:bg-blue-900/20'}`}>
                                                {item.region_name || 'Hovedlager'}
                                            </span>
                                            {item.language && (
                                                <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm shadow-indigo-500/20">
                                                    {item.language}
                                                </span>
                                            )}
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{item.code}</span>
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{item.name}</h3>
                                        {item.ordered_by && <p className="text-[10px] text-gray-400 italic mt-1">Bestilt af: {item.ordered_by}</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-none">{item.quantity}</p>
                                        <p className="text-[10px] font-bold uppercase text-gray-400">stk.</p>
                                    </div>
                                </div>

                                {/* Status Progress Bar */}
                                <div className="mb-6">
                                    <div className="flex justify-between mb-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusInfo.color}`}>
                                            {statusInfo.label}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Trin {statusInfo.step} af 3</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden flex gap-1 p-0.5">
                                        <div className={`h-full rounded-full transition-all duration-500 ${statusInfo.step >= 1 ? 'bg-blue-500 w-1/3' : 'bg-transparent'}`}></div>
                                        <div className={`h-full rounded-full transition-all duration-500 ${statusInfo.step >= 2 ? 'bg-purple-500 w-1/3' : 'bg-transparent'}`}></div>
                                        <div className={`h-full rounded-full transition-all duration-500 ${statusInfo.step >= 3 ? 'bg-amber-500 w-1/3' : 'bg-transparent'}`}></div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-50 dark:border-gray-700">
                                    <button
                                        onClick={() => handleReceiveClick(item)}
                                        disabled={processingId === item.id}
                                        className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                                    >
                                        {processingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Modtaget</>}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {/* Receipt Modal */}
            {receivingItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Bekræft modtagelse</h2>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mt-1">Hvor mange stk. har du modtaget?</p>
                                </div>
                                <button
                                    onClick={() => setReceivingItem(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                >
                                    <X className="h-6 w-6 text-gray-400" />
                                </button>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl mb-8 border border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Publikation:</span>
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{receivingItem.code}</span>
                                </div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 line-clamp-1">{receivingItem.name}</h3>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Antal modtaget:</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={receivedQuantity}
                                            onChange={(e) => setReceivedQuantity(e.target.value)}
                                            className="flex-1 min-w-0 px-6 py-4 bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900/30 rounded-2xl text-2xl font-black text-blue-600 dark:text-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                        />
                                        <div className="bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-xl shrink-0 text-center">
                                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase leading-none">Bestilt</p>
                                            <p className="text-xl font-black text-blue-700 dark:text-blue-300">{receivingItem.quantity}</p>
                                        </div>
                                    </div>
                                    {parseInt(receivedQuantity) !== receivingItem.quantity && (
                                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-pulse">
                                            <AlertCircle className="h-3 w-3" />
                                            Antallet afviger fra bestillingen
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setReceivingItem(null)}
                                    className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
                                >
                                    Annuller
                                </button>
                                <button
                                    onClick={confirmReceive}
                                    disabled={processingId === receivingItem.id}
                                    className="flex-[1.5] py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black shadow-lg shadow-green-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {processingId === receivingItem.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> Bekræft & Læg på lager</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ordered;
