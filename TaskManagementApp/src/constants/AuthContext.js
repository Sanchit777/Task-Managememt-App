import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { requestPermissions } from '../services/NotificationService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for stored user session on load
        const loadSession = async () => {
            try {
                const storedUser = await SecureStore.getItemAsync('user_session');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('SECURE_STORE_LOAD_ERROR:', error.name, error.message, error);
            } finally {
                setLoading(false);
            }
        };
        loadSession();
    }, []);

    const login = async (userData) => {
        setUser(userData);
        await SecureStore.setItemAsync('user_session', JSON.stringify(userData));
    };

    const logout = async () => {
        setUser(null);
        await SecureStore.deleteItemAsync('user_session');
    };

    const updateUserProfile = async (updatedData) => {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        await SecureStore.setItemAsync('user_session', JSON.stringify(newUser));
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUserProfile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
