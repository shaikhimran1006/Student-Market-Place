import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, ShieldCheckIcon, BoltIcon, SparklesIcon, ArrowsRightLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../hooks/useAuth';

const activityFeed = [
  'New verified laptop listed in IT block',
  '5 students bought notes for DBMS today',
  'Campus admin cleared 2 flagged items',
  '3 sellers improved trust scores this week',
];

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [compareIds, setCompareIds] = useState([]);
  const { isSaved, toggle } = useWishlist();
  const { user } = useAuth();

  const loadProducts = async (query = '') => {
    setLoading(true);
    try {
      const res = await api.get('/products', { params: { search: query || undefined, sort: 'trending', limit: 12 } });
      setProducts(res.data.data.products || res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const verifiedPct = useMemo(() => {
    if (!products.length) return 0;
    const safe = products.filter((p) => !p.aiAnalysis?.isFlagged).length;
    return Math.round((safe / products.length) * 100);
  }, [products]);

  const safeNumber = (v, fallback = 0) => {
    const num = Number(v);
    return Number.isFinite(num) ? num : fallback;
  };

  const toggleCompare = (id) => {
    setCompareIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id].slice(-3)));
  };

  const compareProducts = useMemo(() => products.filter((p) => compareIds.includes(p._id)), [products, compareIds]);

  const greetingName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Verified Campus Marketplace</p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Hi {greetingName} 👋</h1>
            <p className="text-slate-600 dark:text-slate-300">Campus-first, trust-led trading. AI keeps fake listings out.</p>
            <div className="flex gap-2 flex-wrap">
              <span className="pill">{verifiedPct}% verified sellers</span>
              <span className="pill">AI blocked fake today</span>
            </div>
          </div>
          <div className="glass p-4 w-full md:w-96">
            <label className="text-xs text-slate-500">AI Smart Search</label>
            <div className="mt-2 flex items-center gap-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
              <input
                className="w-full bg-transparent focus:outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                placeholder="Ask: Find verified laptops under $600"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadProducts(search)}
              />
              <button className="btn-primary" onClick={() => loadProducts(search)}>Go</button>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap text-xs text-slate-500">
              <button className="pill" onClick={() => { setSearch('notes'); loadProducts('notes'); }}>Notes</button>
              <button className="pill" onClick={() => { setSearch('laptop'); loadProducts('laptop'); }}>Laptop</button>
              <button className="pill" onClick={() => { setSearch('subscriptions'); loadProducts('subscriptions'); }}>Subscriptions</button>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-xs text-slate-500">Quick actions</p>
          <div className="mt-3 grid gap-2">
            <Link to="/seller/dashboard" className="btn-primary justify-start"><SparklesIcon className="h-4 w-4" /> Sell an item</Link>
            <Link to="/seller/apply" className="btn-ghost"><BoltIcon className="h-4 w-4" /> Upload notes</Link>
            <Link to="/orders" className="btn-ghost"><ShieldCheckIcon className="h-4 w-4" /> Track order</Link>
          </div>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500">Activity feed</p>
          <div className="mt-3 space-y-3">
            {activityFeed.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="timeline-dot mt-1" />
                <p className="text-sm text-slate-800 dark:text-slate-100">{item}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500">Trust indicators</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Verified sellers</span>
              <span className="text-lg font-semibold text-emerald-600">{verifiedPct}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Fake listings blocked</span>
              <span className="pill bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40">AI live</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Campus relevance</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Curated by category</span>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Discovery (story-style)</h2>
          <span className="text-xs text-slate-500">Compare in drawer · No grids</span>
        </div>
        <div className="space-y-3">
          {loading && (
            <div className="glass p-4 animate-pulse h-32" />
          )}
          {!loading && products.map((product) => (
            <motion.div key={product._id} layout className="glass p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="h-16 w-24 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                  {product.images?.[0]?.url ? (
                    <img src={product.images[0].url} alt={product.title} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400">No image</span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="pill bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40">Verified</span>
                    <span className="pill bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40">Trust {safeNumber(product.ratings?.average, 0).toFixed(1)}</span>
                    <span className="pill">{product.category}</span>
                    {product.aiAnalysis?.isFlagged && <span className="pill bg-rose-100 text-rose-700">Reviewing</span>}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{product.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{product.description}</p>
                  <div className="text-xs text-slate-500">Seller trust score: {safeNumber(product.seller?.sellerRating, 0).toFixed(1)} · Campus: {product.seller?.college || 'Not set'}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button className="btn-ghost" onClick={() => toggle(product._id)}>
                  {isSaved(product._id) ? 'Saved' : 'Save'}
                </button>
                <div className="flex gap-2">
                  <button className="btn-primary" onClick={() => toggleCompare(product._id)}>
                    {compareIds.includes(product._id) ? 'Added' : 'Compare'}
                  </button>
                  <Link className="btn-ghost" to={`/products/${product.slug}`}>Details</Link>
                </div>
              </div>
            </motion.div>
          ))}
          {!loading && products.length === 0 && <div className="text-slate-500">Nothing yet. Try another query.</div>}
        </div>
      </motion.section>

      <AnimatePresence>
        {compareProducts.length > 0 && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            className="fixed right-0 top-20 bottom-4 w-full max-w-md p-4 z-30"
          >
            <div className="glass h-full p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowsRightLeftIcon className="h-5 w-5 text-primary" />
                  <p className="font-semibold">Compare ({compareProducts.length})</p>
                </div>
                <button onClick={() => setCompareIds([])} className="text-slate-500 text-sm inline-flex items-center gap-1">
                  <XMarkIcon className="h-4 w-4" /> Clear
                </button>
              </div>
              <div className="space-y-3 overflow-y-auto pr-1">
                {compareProducts.map((p) => (
                  <div key={p._id} className="border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-3">
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-semibold">{p.title}</p>
                      <button className="text-xs text-rose-600" onClick={() => toggleCompare(p._id)}>Remove</button>
                    </div>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <div className="flex justify-between"><span>Type</span><span className="font-semibold">{p.productType}</span></div>
                      <div className="flex justify-between"><span>Trust</span><span className="font-semibold">{safeNumber(p.ratings?.average, 0).toFixed(1)}</span></div>
                      <div className="flex justify-between"><span>Price</span><span className="font-semibold">${p.price}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
