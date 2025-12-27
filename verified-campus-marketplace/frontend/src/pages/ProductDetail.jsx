import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { HeartIcon } from '@heroicons/react/24/outline';
import { useWishlist } from '../context/WishlistContext';

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const { user } = useAuth();
  const { isSaved, toggle } = useWishlist();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${slug}`);
        setProduct(res.data.data.product);
      } catch (err) {
        setError('Unable to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const addToCart = async () => {
    try {
      await api.post('/cart/add', { productId: product._id, quantity: 1 });
      alert('Added to cart');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to add');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const distribution = useMemo(() => product.ratings?.distribution || {}, [product]);
  const totalRatings = product.ratings?.count || 0;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
          {product.images?.[activeImage]?.url ? (
            <img src={product.images[activeImage].url} alt={product.title} className="h-full w-full object-cover rounded-lg" />
          ) : 'No image'}
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {product.images?.map((img, idx) => (
            <button
              key={idx}
              className={`h-16 w-20 rounded border ${activeImage === idx ? 'border-primary' : 'border-slate-200'}`}
              onClick={() => setActiveImage(idx)}
            >
              <img src={img.url} alt={img.alt || product.title} className="h-full w-full object-cover rounded" />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex gap-2 text-xs mb-2 flex-wrap">
              <span className={`px-2 py-1 rounded-full ${product.productType === 'digital' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{product.productType}</span>
              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">{product.category}</span>
              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">{product.condition}</span>
              {product.isFeatured && <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">Featured</span>}
              {product.stats?.views > 10 && <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700">Trending</span>}
              {product.aiAnalysis?.isFlagged ? (
                <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">Flagged</span>
              ) : (
                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">Assured</span>
              )}
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">{product.title}</h1>
            <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
              <span className="font-semibold text-amber-700">★ {product.ratings?.average?.toFixed(1) || '0.0'}</span>
              <span>({product.ratings?.count || 0} reviews)</span>
            </div>
            <p className="text-primary text-2xl font-bold mt-2">${product.price}</p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-sm text-slate-500 line-through">${product.originalPrice}</p>
            )}
          </div>
        </div>

        <p className="text-slate-700 whitespace-pre-line leading-relaxed">{product.description}</p>

        <div className="flex flex-wrap gap-2 text-sm text-slate-700">
          <span className="px-3 py-2 rounded-lg bg-slate-100">Stock: {product.stock ?? 'n/a'}</span>
          {product.productType === 'digital' ? (
            <span className="px-3 py-2 rounded-lg bg-amber-50 text-amber-800">Instant digital delivery</span>
          ) : (
            <span className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800">Pickup/standard shipping</span>
          )}
        </div>

        <div className="flex gap-3">
          {user ? (
            <button className="btn-primary" onClick={addToCart}>Add to cart</button>
          ) : (
            <p className="text-sm text-slate-600">Login to purchase</p>
          )}
          <button
            className={`px-3 py-2 rounded border text-sm flex items-center gap-1 ${isSaved(product._id) ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-white text-slate-700 border-slate-200'}`}
            onClick={() => toggle(product._id)}
          >
            <HeartIcon className="h-4 w-4" /> {isSaved(product._id) ? 'Saved' : 'Save'}
          </button>
        </div>

        {product.aiAnalysis?.isFlagged && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">Flagged for review: {product.aiAnalysis.flagReason}</div>
        )}

        <div className="card bg-white shadow-none border border-slate-200 mt-4">
          <h3 className="font-semibold mb-2">Rating breakdown</h3>
          <div className="space-y-2">
            {[5,4,3,2,1].map((star) => {
              const count = distribution[star] || 0;
              const pct = totalRatings ? Math.round((count / totalRatings) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-12 text-slate-700">{star} ★</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 text-right text-slate-600">{pct}%</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-2">{totalRatings || 0} verified reviews</p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
