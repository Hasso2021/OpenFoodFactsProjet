import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <strong>OpenFactFood</strong>
          <p>Compare foods and find healthier substitutes with Open Food Facts data.</p>
        </div>
        <div>
          <h4>Privacy (RGPD)</h4>
          <p>
            We only store the data you provide (name, email, allergen preferences, saved
            substitutions). Your data is never shared publicly. You can update or delete your
            profile information at any time.
          </p>
        </div>
        <div>
          <h4>Links</h4>
          <Link to="/products">Search Products</Link>
          <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">
            Open Food Facts
          </a>
        </div>
        <p className="footer-copy">&copy; {new Date().getFullYear()} OpenFactFood</p>
      </div>
    </footer>
  );
}
