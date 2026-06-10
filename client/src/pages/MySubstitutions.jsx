import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSavedSubstitutions, deleteSavedSubstitution } from '../services/api';
import NutriScoreBadge from '../components/NutriScoreBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function MySubstitutions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getSavedSubstitutions();
      setItems(res.data.savedSubstitutions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load saved substitutions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteSavedSubstitution(id);
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your substitutions..." />;

  return (
    <div className="container page">
      <h1>My Substituted Foods</h1>
      <p className="page-subtitle">Substitution results you have saved to your account.</p>

      <ErrorMessage message={error} onRetry={fetchItems} />

      {items.length === 0 ? (
        <div className="empty-state">
          <p>You haven&apos;t saved any substitutions yet.</p>
          <Link to="/products" className="btn btn-primary">
            Search products
          </Link>
        </div>
      ) : (
        <div className="saved-list">
          {items.map((item) => {
            const orig = item.originalProduct;
            const sub = item.substituteProduct;
            const origName = orig.product_name_fr || orig.product_name;
            const subName = sub.product_name_fr || sub.product_name;

            return (
              <article key={item._id} className="saved-card">
                <div className="saved-compare">
                  <div className="saved-product">
                    <span className="saved-label">Original</span>
                    <h3>{origName}</h3>
                    <NutriScoreBadge grade={orig.nutriscore_grade} />
                  </div>
                  <span className="arrow">→</span>
                  <div className="saved-product">
                    <span className="saved-label">Substitute</span>
                    <h3>{subName}</h3>
                    <NutriScoreBadge grade={sub.nutriscore_grade} />
                  </div>
                </div>
                <p className="saved-date">
                  Saved on {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                </p>
                <div className="saved-actions">
                  <Link to={`/products/${sub.code}`} className="btn btn-secondary btn-sm">
                    View substitute
                  </Link>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    disabled={deleting === item._id}
                    onClick={() => handleDelete(item._id)}
                  >
                    {deleting === item._id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
