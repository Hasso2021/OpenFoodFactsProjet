import { Link } from 'react-router-dom';
import NutriScoreBadge from './NutriScoreBadge';

// Carte produit affichée dans les résultats de recherche
export default function ProductCard({ product }) {
  const name = product.product_name || product.product_name_fr || product.brands || 'Unknown product';

  return (
    <article className="product-card">
      <div className="product-card-image">
        {product.image_url ? (
          <img src={product.image_url} alt={name} loading="lazy" />
        ) : (
          <div className="product-placeholder">🍽️</div>
        )}
        <NutriScoreBadge grade={product.nutriscore_grade} />
      </div>
      <div className="product-card-body">
        <h3>{name}</h3>
        {product.brands && product.brands !== name && (
          <p className="product-category">{product.brands}</p>
        )}
        {product.code && <p className="product-code">Barcode: {product.code}</p>}
        {product.categories_tags?.[0] && (
          <p className="product-category">{product.categories_tags[0].replace('en:', '')}</p>
        )}
        <div className="product-card-actions">
          <Link to={`/products/${product.code}`} className="btn btn-primary btn-sm">
            Details
          </Link>
          <Link to={`/substitutes/${product.code}`} className="btn btn-secondary btn-sm">
            Find Substitute
          </Link>
        </div>
      </div>
    </article>
  );
}
