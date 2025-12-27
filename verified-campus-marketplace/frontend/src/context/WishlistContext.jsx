import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'wishlistIds';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [savedIds, setSavedIds] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedIds(JSON.parse(raw));
    } catch (_) {
      setSavedIds([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
    } catch (_) {
      /* ignore */
    }
  }, [savedIds]);

  const toggle = (id) => {
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const value = useMemo(() => ({ savedIds, toggle, isSaved: (id) => savedIds.includes(id) }), [savedIds]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => useContext(WishlistContext);
