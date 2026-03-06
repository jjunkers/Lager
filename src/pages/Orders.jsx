import React, { useState, useEffect } from 'react';
import { ShoppingCart, AlertTriangle, RefreshCcw, ArrowRight, CheckCircle2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStats } from '../context/StatsContext';

const Orders = () => {
    const { user } = useAuth();
    const { refreshStats } = useStats();
    const [orders, setOrders] = useState([]);
    const [requests, setRequests] = useState([]);
    const [approvedRequests, setApprovedRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copying, setCopying] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);

    const fetchOrders = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // Fetch shortages (automatic)
            const res = await fetch(`/api/orders?role=${user?.role}`);
            if (res.ok) {
                setOrders(await res.json());
            }

            // Fetch user requests (needs approval or waiting for HQ order)
            const resOrdered = await fetch(`/api/ordered?role=${user?.role}`);
            if (resOrdered.ok) {
                const allOrdered = await resOrdered.json();
                // Filter requests that are not yet approved
                setRequests(allOrdered.filter(item => item.approved === 0));

                // Filter requests that ARE approved but still in 'Bestilling' status (haven't been ordered at HQ yet)
                const approvedWaiting = allOrdered.filter(item => item.approved === 1 && item.status === 'Bestilling');

                // We'll combine these with the automatic 'orders' for the display
                // Note: We keep them in requests state for easier management or create a new state
                setApprovedRequests(approvedWaiting);
            }
        } catch (error) {
            console.error("Failed to load orders", error);
        }
        setLoading(false);
    };

    const handleApprove = async (item) => {
        setProcessingId(item.id);
        try {
            const res = await fetch('/api/ordered/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: item.id,
                    approved: true,
                    currentUserRole: user?.role
                })
            });
            if (res.ok) {
                // Refresh to move item from Requests to Shortages section
                await fetchOrders(true);
                refreshStats();
            }
        } catch (err) {
            console.error("Failed to approve", err);
        }
        setProcessingId(null);
    };

    const handleReject = async (item) => {
        if (!confirm('Er du sikker på at du vil afvise denne anmodning?')) return;
        setProcessingId(item.id);
        try {
            const res = await fetch('/api/ordered', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: item.id,
                    catalog_id: item.catalog_id,
                    region: item.region,
                    quantity: 0,
                    currentUserRole: user?.role
                })
            });
            if (res.ok) {
                setRequests(prev => prev.filter(r => r.id !== item.id));
                refreshStats();
            }
        } catch (err) {
            console.error("Failed to reject", err);
        }
        setProcessingId(null);
    };

    const handleDelete = (e, item) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setDeleteItem(item);
    };

    const confirmDelete = async () => {
        if (!deleteItem) return;
        const item = deleteItem;
        setDeleteItem(null);
        setProcessingId(item.id);

        try {
            const res = await fetch('/api/ordered', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: item.id,
                    action: 'delete',
                    currentUserRole: user?.role
                })
            });
            if (res.ok) {
                setRequests(prev => prev.filter(r => r.id !== item.id));
                setApprovedRequests(prev => prev.filter(r => r.id !== item.id));
                await fetchOrders(true); // Silent fetch
                refreshStats();
            } else {
                const data = await res.json();
                alert(`Fejl: ${data.error}`);
            }
        } catch (err) {
            console.error("Failed to delete", err);
        }
        setProcessingId(null);
    };

    const copyToClipboard = async () => {
        const combinedOrders = [...orders];
        approvedRequests.forEach(req => {
            combinedOrders.push({
                code: req.code,
                needed: req.quantity,
                region_name: req.region_name,
                description: req.name,
                is_manual: true,
                id: req.id
            });
        });

        if (combinedOrders.length === 0) return;

        setCopying(true);

        let text = `Kære Anders, \n\n`;
        text += `Vi mangler disse publikationer på lager: \n`;

        combinedOrders.forEach(item => {
            const region = item.region_name ? `[${item.region_name.toUpperCase()}]` : '';
            const description = item.description || item.name || '';
            text += `${item.needed} stk.${region} - (${item.code}) ${description} \n`;
        });

        text += `\nKærlig hilsen\n${user?.full_name || 'Jørgen Junker'}`;

        try {
            await navigator.clipboard.writeText(text);

            // Move items to Ordered page
            await fetch('/api/orders/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shortages: orders,
                    requestIds: approvedRequests.map(r => r.id),
                    currentUserRole: user?.role,
                    user: user
                })
            });

            setTimeout(() => setCopying(false), 2000);
            fetchOrders(true);
            refreshStats();
        } catch (err) {
            console.error('Kunne ikke kopiere tekst: ', err);
            setCopying(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 sticky top-16 md:top-0 bg-gray-50 dark:bg-gray-900 z-30 py-4 -mx-4 md:-mx-8 px-4 md:px-8 border-b border-gray-200 dark:border-gray-700">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <ShoppingCart className="h-8 w-8 text-blue-600" />
                        Bestillinger
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Publikationer under minimumsgrænse og godkendte anmodninger.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {(orders.length > 0 || approvedRequests.length > 0) && (
                        <button
                            onClick={copyToClipboard}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all shadow-xl ${copying
                                ? 'bg-green-600 text-white shadow-green-500/20 scale-95'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 active:scale-95'
                                }`}
                        >
                            {copying ? (
                                <>
                                    <RefreshCcw className="h-4 w-4 animate-spin" />
                                    <span>Kopieret!</span>
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="h-4 w-4" />
                                    <span>Kopiér til e-mail</span>
                                </>
                            )}
                        </button>
                    )}
                    <button
                        onClick={fetchOrders}
                        className="p-3 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-2xl transition-colors border border-gray-200 dark:border-gray-700 shadow-sm"
                        title="Opdater liste"
                    >
                        <RefreshCcw className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Requests Section */}
            {requests.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-pulse"></span>
                        Nye anmodninger fra brugere ({requests.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {requests.map((req) => (
                            <div key={req.id} className="bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-100 dark:border-amber-900/30 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded uppercase tracking-wider shadow-sm shadow-indigo-500/20">
                                                    {req.language}
                                                </span>
                                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">
                                                    Bestilt af: {req.ordered_by}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => handleDelete(e, req)}
                                                className="text-amber-400 hover:text-red-500 transition-colors p-1"
                                                title="Slet bestilling"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{req.name}</h3>
                                        {req.code && <p className="text-xs font-mono text-gray-400 mt-1">{req.code}</p>}
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm">
                                        <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{req.quantity}</p>
                                        <p className="text-[8px] font-bold uppercase text-gray-400 tracking-tighter">stk.</p>
                                    </div>
                                </div>
                                {req.comment && (
                                    <div className="mb-6 p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-amber-100/50 dark:border-amber-900/20 italic text-sm text-gray-600 dark:text-gray-400">
                                        "{req.comment}"
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleApprove(req)}
                                        disabled={processingId === req.id}
                                        className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Godkend
                                    </button>
                                    <button
                                        onClick={() => handleReject(req)}
                                        disabled={processingId === req.id}
                                        className="px-4 py-2.5 bg-white dark:bg-gray-800 text-red-600 border border-red-100 dark:border-red-900/30 rounded-xl font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Afvis
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Automatic Shortages & Approved Requests Section */}
            <h2 className="text-xl font-black text-gray-800 dark:text-white mb-6">
                Mangler på lager ({orders.length + approvedRequests.length})
            </h2>
            {orders.length === 0 && approvedRequests.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Alt er på lager</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Der er i øjeblikket ingen publikationer under minimumsgrænsen eller godkendte anmodninger.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Visualise automatic shortages */}
                    {orders.map((order, idx) => (
                        <div key={`auto-${order.code}-${order.region}`} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${order.region === 'da' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                        (order.region === 'sv' || order.region === 'z') ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}>
                                        {order.region_name}
                                    </span>
                                    {order.language && (
                                        <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-black uppercase tracking-wider shadow-sm shadow-indigo-500/20">
                                            {order.language}
                                        </span>
                                    )}
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white mt-1 pr-10">{order.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{order.code}</p>
                                </div>
                                <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-2xl">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-50 dark:border-gray-700">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight">Lager:</span>
                                    <span className="font-black text-red-600 dark:text-red-400">{order.current}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight">Minimum:</span>
                                    <span className="font-black text-gray-700 dark:text-gray-300">{order.min}</span>
                                </div>

                                <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex items-center justify-between border border-blue-100 dark:border-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                    <div>
                                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-tighter opacity-70">Bestil op til</p>
                                        <p className="text-3xl font-black text-blue-700 dark:text-blue-300 tracking-tighter">{order.needed}</p>
                                    </div>
                                    <ArrowRight className="h-7 w-7 text-blue-400 dark:text-blue-500 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Visualise approved requests */}
                    {approvedRequests.map((req, idx) => (
                        <div key={`approved-${req.id}`} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-blue-100 dark:border-blue-900/30 hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 flex gap-1">
                                <button
                                    type="button"
                                    onClick={(e) => handleDelete(e, req)}
                                    className="bg-red-50 dark:bg-red-900/20 p-1.5 rounded-xl text-red-400 hover:text-red-600 transition-colors"
                                    title="Slet bestilling"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-xl">
                                    <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-black uppercase tracking-wider shadow-sm shadow-indigo-500/20">
                                        {req.language}
                                    </span>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white mt-1 pr-10">{req.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{req.code}</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-50 dark:border-gray-700">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    GODKENDT ANMODNING FRA: {req.ordered_by}
                                </div>
                                <div className="mt-4 bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl flex items-center justify-between border border-green-100 dark:border-green-900/30">
                                    <div>
                                        <p className="text-[10px] text-green-600 dark:text-green-400 font-black uppercase tracking-tighter opacity-70">Antal til bestilling</p>
                                        <p className="text-3xl font-black text-green-700 dark:text-green-300 tracking-tighter">{req.quantity}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
                        <div className="bg-red-100 dark:bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white text-center mb-2">Er du helt sikker?</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-8">
                            Du er ved at slette <span className="font-bold text-gray-900 dark:text-white">{deleteItem.name}</span>.
                            Handlingen vil blive logget i historikken som slettet.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmDelete}
                                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-red-500/20"
                            >
                                Ja, slet den
                            </button>
                            <button
                                onClick={() => setDeleteItem(null)}
                                className="w-full py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-2xl font-bold transition-all active:scale-95"
                            >
                                Fortryd
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
