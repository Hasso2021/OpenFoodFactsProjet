import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductByBarcode } from '../services/api';
import NutriScoreBadge from '../components/NutriScoreBadge';
import NutritionChart from '../components/NutritionChart';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// Page de détail d'un produit (code-barres dans l'URL)
export default function ProductDetail() {
  const { code } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getProductByBarcode(code);
        setProduct(res.data.product);
      } catch (err) {
        setError(err.response?.data?.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [code]);

  if (loading) return <LoadingSpinner message="Loading product..." />;
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

  const name = product.product_name_fr || product.product_name;

  return (
    <div className="container page product-detail">
      <Link to="/products" className="back-link">
        ← Back to search
      </Link>

      <div className="product-detail-grid">
        <div className="product-detail-image">
          {product.image_url ? (
            <img src={product.image_url} alt={name} />
          ) : (
            <div className="product-placeholder large">🍽️</div>
          )}
        </div>

        <div className="product-detail-info">
          <div className="product-detail-header">
            <h1>{name}</h1>
            <NutriScoreBadge grade={product.nutriscore_grade} size="lg" />
          </div>

          <p>
            <strong>Barcode:</strong> {product.code}
          </p>

          {product.categories_tags?.length > 0 && (
            <div className="tags">
              <strong>Categories:</strong>
              {product.categories_tags.slice(0, 5).map((tag) => (
                <span key={tag} className="tag">
                  {tag.replace('en:', '')}
                </span>
              ))}
            </div>
          )}

          {product.allergens_tags?.length > 0 && (
            <div className="tags allergens">
              <strong>Allergens:</strong>
              {product.allergens_tags.map((tag) => (
                <span key={tag} className="tag tag-warning">
                  {tag.replace('en:', '')}
                </span>
              ))}
            </div>
          )}

          <Link to={`/substitutes/${product.code}`} className="btn btn-primary">
            Find Healthier Substitute
          </Link>
        </div>
      </div>

      {product.nutriments && Object.keys(product.nutriments).length > 0 && (
        <section className="nutrition-section">
          <h2>Nutrition Facts</h2>
          <NutritionChart nutriments={product.nutriments} />
        </section>
      )}
    </div>
  );
}
