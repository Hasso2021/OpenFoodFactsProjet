import { useState, useEffect } from 'react';
import { searchProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'Snacks', label: 'Snacks' },
  { value: 'Beverages', label: 'Beverages' },
  { value: 'Dairy', label: 'Dairy' },
  { value: 'Biscuits', label: 'Biscuits' },
  { value: 'Breakfast-cereals', label: 'Breakfast cereals' },
  { value: 'Chocolates', label: 'Chocolates' },
];

export default function Products() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [barcode, setBarcode] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const params = {};
      if (query.trim()) params.q = query.trim();
      if (category) params.category = category;
      if (barcode.trim()) params.barcode = barcode.trim();

      const res = await searchProducts(params);
      setProducts(res.data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Affiche des produits par défaut au premier chargement
  useEffect(() => {
    const loadDefaults = async () => {
      setLoading(true);
      try {
        const res = await searchProducts({ category: 'Snacks', pageSize: 12 });
        setProducts(res.data.products || []);
      } catch {
        // Échec silencieux au chargement initial
      } finally {
        setLoading(false);
      }
    };
    loadDefaults();
  }, []);

  return (
    <div className="container page">
      <h1>Search Food Products</h1>
      <p className="page-subtitle">
        Search by product name, category, or barcode. Data comes from Open Food Facts and our local
        database.
      </p>

      <form className="search-form" onSubmit={handleSearch}>
        <div className="search-row">
          <input
            type="text"
            placeholder="Product name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Product name"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="search-row">
          <input
            type="text"
            placeholder="Barcode (e.g. 7622210449283)"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            aria-label="Barcode"
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      <ErrorMessage message={error} onRetry={handleSearch} />

      {loading && <LoadingSpinner message="Searching products..." />}

      {!loading && searched && products.length === 0 && !error && (
        <p className="empty-state">No products found. Try a different search.</p>
      )}

      {!loading && products.length > 0 && (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product.code || product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
