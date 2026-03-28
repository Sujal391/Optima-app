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
      // New API: { cart: { products: [...], totalItems, amount, gst, totalAmount } }
      const cart = res.data?.cart;
      
      if (!cart) {
        setCartItems([]);
        setCartCount(0);
        return;
      }

      const items = Array.isArray(cart.products) ? cart.products : [];
      setCartItems(items);
      // Use unique items count for badge, not total boxes
      setCartCount(items.length);
    } catch (e) {
      console.log('Cart fetch error:', e?.message || String(e));
      // If unauthorized or not found, clear cart to avoid stale badge
      if (e?.status === 401 || e?.status === 404) {
        setCartItems([]);
        setCartCount(0);
      }
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
