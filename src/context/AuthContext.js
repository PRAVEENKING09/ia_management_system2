import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for existing session
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            console.log("Sending login request to backend...");
            const response = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            console.log("Response status:", response.status);

            const data = await response.json();
            console.log("Response data:", data);

            if (response.ok) {
                // Backend returns: { token, id, username, role }
                const userData = {
                    id: data.username, // Using username as the ID for frontend logic
                    role: data.role.toLowerCase(), // Frontend expects lowercase roles
                    name: data.username,
                    token: data.token
                };

                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                return { success: true, role: userData.role };
            } else {
                return { success: false, message: 'Invalid credentials' };
            }
        } catch (error) {
            console.error("Login error:", error);
            // alert("Network Error: " + error.message + ". Check if Backend is running!");
            return { success: false, message: 'Network error: ' + error.message };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
