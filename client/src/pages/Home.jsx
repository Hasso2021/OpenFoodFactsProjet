import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      <section className="hero">
        <div className="container hero-content">
          <h1>Eat smarter with OpenFactFood</h1>
          <p>
            Search thousands of food products, compare nutrition facts, and discover healthier
            substitutes powered by the Open Food Facts database.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary btn-lg">
              Search Products
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn btn-secondary btn-lg">
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="features container">
        <h2>How it works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🔍</span>
            <h3>Search</h3>
            <p>Find products by name, category, or barcode using Open Food Facts data.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h3>Compare</h3>
            <p>View Nutri-Score grades and detailed nutrition information for each product.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🥦</span>
            <h3>Substitute</h3>
            <p>Get healthier alternative suggestions based on Nutri-Score and your allergen profile.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">💾</span>
            <h3>Save</h3>
            <p>Registered users can save substitution results to their personal account.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
