import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCart } from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (token) fetchCart();
  }, [token]);

  const fetchCart = async () => {
    try {
      const res = await getCart();
      const items = res.data?.items || res.data || [];
      setCartItems(items);
      setCartCount(items.length);
    } catch (e) {
      console.log('Cart fetch error:', e);
    }
  };

  const refreshCart = () => fetchCart();

  return (
    <CartContext.Provider value={{ cartItems, cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
