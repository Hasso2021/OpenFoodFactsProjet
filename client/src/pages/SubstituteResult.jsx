import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSubstitutes, saveSubstitution } from '../services/api';
import { useAuth } from '../context/AuthContext';
import NutriScoreBadge from '../components/NutriScoreBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// Page des substituts plus sains pour un produit donné
export default function SubstituteResult() {
  const { code } = useParams();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const fetchSubstitutes = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getSubstitutes(code);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to find substitutes');
      } finally {
        setLoading(false);
      }
    };
    fetchSubstitutes();
  }, [code]);

  const handleSave = async (originalProduct, substituteProduct) => {
    if (!isAuthenticated) return;

    setSaving(substituteProduct.code);
    setSaveMessage('');
    try {
      await saveSubstitution({ originalProduct, substituteProduct });
      setSaveMessage('Saved to your account!');
    } catch (err) {
      setSaveMessage(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <LoadingSpinner message="Finding healthier substitutes..." />;
  if (error) {
    return (
      <div className="container page">
        <ErrorMessage message={error} />
        <Link to="/products" className="btn btn-secondary">
          Back to search
        </Link>
      </div>
    );
  }

  const { original, curated = [], suggestions = [] } = data;
  const allSubstitutes = [
    ...curated.map((c) => ({ ...c, substitute: c.substitute })),
    ...suggestions,
  ];
  const originalName = original.product_name_fr || original.product_name;

  return (
    <div className="container page substitute-page">
      <Link to={`/products/${code}`} className="back-link">
        ← Back to product
      </Link>

      <h1>Healthier Substitutes</h1>

      <div className="original-product-card">
        <h2>Original product</h2>
        <div className="substitute-compare">
          {original.image_url && (
            <img src={original.image_url} alt={originalName} className="substitute-thumb" />
          )}
          <div>
            <h3>{originalName}</h3>
            <NutriScoreBadge grade={original.nutriscore_grade} size="lg" />
          </div>
        </div>
      </div>

      {saveMessage && <p className="success-message">{saveMessage}</p>}

      {allSubstitutes.length === 0 ? (
        <p className="empty-state">
          No healthier substitutes found in this category. Try searching for a different product.
        </p>
      ) : (
        <div className="substitutes-list">
          <h2>Suggested alternatives ({allSubstitutes.length})</h2>
          {allSubstitutes.map((item, index) => {
            const sub = item.substitute;
            const subName = sub.product_name_fr || sub.product_name;
            return (
              <article key={sub.code || index} className="substitute-card">
                <div className="substitute-compare">
                  {sub.image_url ? (
                    <img src={sub.image_url} alt={subName} className="substitute-thumb" />
                  ) : (
                    <div className="product-placeholder">🥗</div>
                  )}
                  <div className="substitute-info">
                    <h3>{subName}</h3>
                    <div className="substitute-scores">
                      <NutriScoreBadge grade={original.nutriscore_grade} />
                      <span className="arrow">→</span>
                      <NutriScoreBadge grade={sub.nutriscore_grade} />
                    </div>
                    <p className="substitute-reason">{item.reason}</p>
                    {item.source === 'curated' && (
                      <span className="tag tag-curated">Curated by admin</span>
                    )}
                  </div>
                </div>
                <div className="substitute-actions">
                  <Link to={`/products/${sub.code}`} className="btn btn-secondary btn-sm">
                    View details
                  </Link>
                  {isAuthenticated && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={saving === sub.code}
                      onClick={() => handleSave(original, sub)}
                    >
                      {saving === sub.code ? 'Saving...' : 'Save to my account'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!isAuthenticated && allSubstitutes.length > 0 && (
        <p className="login-prompt">
          <Link to="/login">Log in</Link> to save substitution results to your account.
        </p>
      )}
    </div>
  );
}
