import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [users, setUsers] = useState([]); // List of all users for admin
    const [user, setUser] = useState(null); // Current logged in user
    const [loading, setLoading] = useState(true);

    const fetchUsers = async (overrideRole = null) => {
        const activeRole = overrideRole || user?.role;
        if (!activeRole) return;

        try {
            const res = await fetch(`/api/users?role=${activeRole}`);
            if (res.ok) {
                const data = await res.json();
                const mappedData = data.map(u => ({
                    ...u,
                    requireChangePassword: !!(u.require_change_password || u.requireChangePassword)
                }));
                setUsers(mappedData);
            }
        } catch (e) {
            console.error("Failed to fetch users", e);
        }
    };

    // Check for existing session (stored token/user in localStorage for persistence across refreshes)
    useEffect(() => {
        const checkSession = async () => {
            const storedUser = localStorage.getItem('lager_user_session');
            if (storedUser) {
                try {
                    const u = JSON.parse(storedUser);
                    setUser(u);

                    // Fetch fresh data for the user to sync status (especially requireChangePassword)
                    const res = await fetch(`/api/users?username=${u.username}&role=${u.role}`);
                    if (res.ok) {
                        const usersData = await res.json();
                        const freshUser = usersData.find(usr => usr.username === u.username);

                        // If user was deleted or deactivated, force logout
                        if (!freshUser || freshUser.is_active === 0) {
                            console.warn('Bruger slettet eller deaktiveret — logger ud.');
                            setUser(null);
                            setUsers([]);
                            localStorage.removeItem('lager_user_session');
                            setLoading(false);
                            return;
                        }

                        const updatedUser = {
                            ...freshUser,
                            requireChangePassword: !!(freshUser.require_change_password || freshUser.requireChangePassword)
                        };
                        setUser(updatedUser);
                        localStorage.setItem('lager_user_session', JSON.stringify(updatedUser));
                    }

                    if (u && (u.role === 'admin' || u.role === 'superuser')) {
                        fetchUsers(u.role);
                    }
                } catch (error) {
                    console.error("Failed to parse or sync user session:", error);
                    localStorage.removeItem('lager_user_session'); // Clear invalid session
                }
            }
            setLoading(false);
        };

        checkSession();
    }, []);

    // Periodically validate session (every 30s) — logs out deleted/deactivated users quickly
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/users?username=${user.username}&role=${user.role}`);
                if (res.ok) {
                    const usersData = await res.json();
                    const freshUser = usersData.find(usr => usr.username === user.username);
                    if (!freshUser || freshUser.is_active === 0) {
                        console.warn('Session ugyldig — bruger slettet eller deaktiveret.');
                        setUser(null);
                        setUsers([]);
                        localStorage.removeItem('lager_user_session');
                    }
                }
            } catch (e) {
                // Network error — don't log out, just skip
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [user]);

    const login = async (username, password) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Login failed:", data.error);
                return { success: false, error: data.error || 'Login failed' };
            }

            const mappedUser = {
                ...data,
                requireChangePassword: !!(data.require_change_password || data.requireChangePassword)
            };

            setUser(mappedUser);
            localStorage.setItem('lager_user_session', JSON.stringify(mappedUser));

            if (data.role === 'admin' || data.role === 'superuser') {
                fetchUsers(data.role);
            }

            return { success: true };
        } catch (err) {
            console.error("Login error:", err);
            return { success: false, error: 'Der opstod en netværksfejl. Prøv igen.' };
        }
    };

    const logout = () => {
        setUser(null);
        setUsers([]);
        localStorage.removeItem('lager_user_session');
        localStorage.removeItem('selectedMonth');
        sessionStorage.removeItem('sessionStarted');
    };

    const createUser = async (newUser) => {
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newUser, currentUserRole: user?.role })
            });
            if (res.ok) {
                await fetchUsers(); // Refresh list
                return true;
            }
            return false;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const changePassword = async (username, newPassword) => {
        const result = await updateUser(username, {
            password: newPassword,
            requireChangePassword: false
        });

        if (result && user?.username === username) {
            // Update local state if the current user changed their own password
            const updatedUser = { ...user, requireChangePassword: false };
            setUser(updatedUser);
            localStorage.setItem('lager_user_session', JSON.stringify(updatedUser));
        }
        return result;
    };

    const updateUser = async (username, data) => {
        try {
            const res = await fetch('/api/users/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, ...data, currentUserRole: user?.role, currentUsername: user?.username })
            });
            if (res.ok) {
                await fetchUsers();
                return true;
            }
            return false;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const deleteUser = async (username) => {
        try {
            const res = await fetch('/api/users/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, currentUserRole: user?.role })
            });
            if (res.ok) {
                await fetchUsers();
                return true;
            }
            return false;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, users, login, logout, createUser, changePassword, updateUser, deleteUser, fetchUsers, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
