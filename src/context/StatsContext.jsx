import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const StatsContext = createContext(null);

export const StatsProvider = ({ children }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        total_shortages: 0,
        da_shortages: 0,
        no_shortages: 0,
        sv_shortages: 0,
        orders_count: 0,
        shipped_count: 0,
        unread_notifications: 0
    });

    const fetchStats = useCallback(async () => {
        if (!user) return;

        try {
            if (user.role === 'admin' || user.role === 'superuser') {
                const res = await fetch(`/api/admin/stats?role=${user.role}`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } else {
                // Fetch user-specific stats for non-admins
                const username = user.full_name || user.username;
                const res = await fetch(`/api/user/stats?username=${encodeURIComponent(username)}`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(prev => ({
                        ...prev,
                        user_active_orders: data.user_active_orders || 0
                    }));
                }
            }
        } catch (e) {
            console.error("Failed to fetch stats", e);
        }
    }, [user]);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000); // Polling hvert 10. sekund for hurtigere respons
        return () => clearInterval(interval);
    }, [fetchStats]);

    return (
        <StatsContext.Provider value={{ stats, refreshStats: fetchStats }}>
            {children}
        </StatsContext.Provider>
    );
};

export const useStats = () => useContext(StatsContext);
