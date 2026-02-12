import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const login = (username, password) => {
        // Mock authentication logic
        if (username === 'admin' && password === 'admin123') {
            setUser({ username, role: 'admin', name: 'Administrator' });
            return true;
        }
        if (username === 'super' && password === 'super123') {
            setUser({ username, role: 'superuser', name: 'Super Bruger' });
            return true;
        }
        if (username === 'user' && password === 'user123') {
            setUser({ username, role: 'user', name: 'Almindelig Bruger' });
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
