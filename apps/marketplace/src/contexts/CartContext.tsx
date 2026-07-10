"use client";


import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type CartItem = {
    id: string; // Unique ID for the cart item itself
    type: 'order' | 'booking' | 'subscription';
    payload: any;
    timestamp: number;
};

interface CartContextType {
    cart: CartItem[];
    addItemToCart: (item: Omit<CartItem, 'timestamp' | 'id'>) => void;
    removeItemFromCart: (itemId: string) => void;
    clearCart: () => void;
    getCartTotal: () => number;
    itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const localData = window.sessionStorage.getItem('alrehlaCart');
            if (localData) {
                setCart(JSON.parse(localData));
            }
        } catch (error) {
            console.error("Could not parse cart from sessionStorage", error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        try {
            window.sessionStorage.setItem('alrehlaCart', JSON.stringify(cart));
        } catch (error) {
            console.error("Could not save cart to sessionStorage", error);
            // If storage is full, we could alert the user, but typically we just log it.
            // Consider using localStorage if persistent or handling QuotaExceededError
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                 console.warn("SessionStorage is full. Cart items might be lost on refresh.");
            }
        }
    }, [cart, isLoaded]);

    const addItemToCart = useCallback((item: Omit<CartItem, 'timestamp' | 'id'>) => {
        try {
            const newItem: CartItem = { ...item, id: uuidv4(), timestamp: Date.now() };
            setCart(prevCart => [...prevCart, newItem]);
        } catch (e) {
            console.error("Failed to add item to cart state", e);
        }
    }, []);
    
    const removeItemFromCart = useCallback((itemId: string) => {
        setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
        try {
            window.sessionStorage.removeItem('alrehlaCart');
        } catch (e) {
            console.error("Failed to clear cart storage", e);
        }
    }, []);
    
    const getCartTotal = useCallback(() => {
        return cart.reduce((total, item) => {
            const itemBase = item.payload.total || item.payload.totalPrice || 0;
            const shipping = item.payload.shippingPrice || 0;
            return total + itemBase + shipping;
        }, 0);
    }, [cart]);

    const value = useMemo(() => ({
        cart,
        addItemToCart,
        removeItemFromCart,
        clearCart,
        getCartTotal,
        itemCount: cart.length
    }), [cart, addItemToCart, removeItemFromCart, clearCart, getCartTotal]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = (): CartContextType => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
