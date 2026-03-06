import React, { useState, useEffect } from 'react';
import { ShoppingCart, Clock, Package, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStats } from '../context/StatsContext';

const MyOrders = () => {
    const { user } = useAuth();
    const { refreshStats } = useStats();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMyOrders = async () => {
        setLoading(true);
        try {
            const username = user.full_name || user.username;
            const res = await fetch(`/api/user/orders?username=${encodeURIComponent(username)}`);
            if (res.ok) {
                setOrders(await res.json());
            }
        } catch (error) {
            console.error("Failed to load your orders", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMyOrders();
    }, [user]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Anmodning': return <Clock className="h-4 w-4 text-amber-500" />;
            case 'Bestilling': return <Clock className="h-4 w-4 text-blue-500" />;
            case 'Bestilt': return <Package className="h-4 w-4 text-purple-500" />;
            case 'Afhentes': return <Package className="h-4 w-4 text-indigo-500" />;
            case 'Modtaget': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'Anmodning': return 'Venter på godkendelse';
            case 'Bestilling': return 'Godkendt - Venter på HQ bestilling';
            case 'Bestilt': return 'Bestilt ved admin';
            case 'Afhentes': return 'Kan afhentes';
            default: return status;
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
                        <ShoppingCart className="mr-3 h-8 w-8 text-blue-600" />
                        Mine Bestillinger
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Her kan du følge status på de publikationer du har bestilt.
                    </p>
                </div>
                <button
                    onClick={fetchMyOrders}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Opdater"
                >
                    <RefreshCcw className="h-5 w-5" />
                </button>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="h-8 w-8 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Ingen aktive bestillinger</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                        Du har ikke nogen aktive bestillinger lige nu. Når du bestiller noget i kataloget, vil det dukke op her.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center mb-1">
                                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded mr-2">
                                            {order.code}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(order.ordered_at).toLocaleDateString('da-DK')}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{order.name}</h3>
                                    <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center">
                                            <span className="font-bold mr-1 italic">Antal:</span> {order.quantity}
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-bold mr-1 italic">Sprog:</span> {order.language}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-lg flex items-center space-x-2 border border-gray-100 dark:border-gray-600">
                                        {getStatusIcon(order.status)}
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {getStatusText(order.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {order.comment && (
                                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-400 text-sm text-gray-600 dark:text-gray-400 rounded-r-lg">
                                    <span className="font-bold italic mr-2">Kommentar:</span>
                                    {order.comment}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyOrders;
