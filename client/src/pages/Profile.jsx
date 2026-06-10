import { useState, useEffect } from 'react';
import { getAllergensTaxonomy, updateProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [allergens, setAllergens] = useState(user?.allergens || []);
  const [taxonomy, setTaxonomy] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchTaxonomy = async () => {
      try {
        const res = await getAllergensTaxonomy();
        setTaxonomy(res.data.taxonomy || {});
      } catch {
        // Use fallback common allergens if taxonomy fails
        setTaxonomy({
          'en:gluten': { name: { en: 'Gluten', fr: 'Gluten' } },
          'en:milk': { name: { en: 'Milk', fr: 'Lait' } },
          'en:eggs': { name: { en: 'Eggs', fr: 'Œufs' } },
          'en:nuts': { name: { en: 'Nuts', fr: 'Fruits à coque' } },
          'en:soybeans': { name: { en: 'Soybeans', fr: 'Soja' } },
          'en:fish': { name: { en: 'Fish', fr: 'Poisson' } },
          'en:celery': { name: { en: 'Celery', fr: 'Céleri' } },
          'en:mustard': { name: { en: 'Mustard', fr: 'Moutarde' } },
          'en:sesame-seeds': { name: { en: 'Sesame', fr: 'Sésame' } },
          'en:crustaceans': { name: { en: 'Crustaceans', fr: 'Crustacés' } },
        });
      } finally {
        setLoading(false);
      }
    };
    fetchTaxonomy();
  }, []);

  const toggleAllergen = (tag) => {
    setAllergens((prev) =>
      prev.includes(tag) ? prev.filter((a) => a !== tag) : [...prev, tag]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await updateProfile({ name, allergens });
      updateUser(res.data.user);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading profile..." />;

  const allergenEntries = Object.entries(taxonomy).slice(0, 30);

  return (
    <div className="container page profile-page">
      <h1>My Profile</h1>
      <p className="page-subtitle">
        Configure your allergen preferences. Substitute suggestions will exclude products containing
        your selected allergens.
      </p>

      <ErrorMessage message={error} />
      {success && <p className="success-message">{success}</p>}

      <form onSubmit={handleSave} className="profile-form">
        <div className="form-group">
          <label htmlFor="profile-name">Name</label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" value={user?.email || ''} disabled />
          <small>Email cannot be changed</small>
        </div>

        <fieldset className="allergens-fieldset">
          <legend>My allergens</legend>
          <p className="fieldset-hint">Select allergens to avoid in substitute suggestions.</p>
          <div className="allergens-grid">
            {allergenEntries.map(([tag, data]) => {
              const label = data?.name?.fr || data?.name?.en || tag.replace('en:', '');
              return (
                <label key={tag} className="allergen-checkbox">
                  <input
                    type="checkbox"
                    checked={allergens.includes(tag)}
                    onChange={() => toggleAllergen(tag)}
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>

      <section className="privacy-section">
        <h2>Your data (RGPD)</h2>
        <p>
          We store your name, email, allergen preferences, and saved substitutions. This data is
          only accessible to you and is never exposed publicly. Contact an administrator to request
          account deletion.
        </p>
      </section>
    </div>
  );
}
