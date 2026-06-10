import { useState, useEffect } from 'react';
import {
  getAdminStats,
  getAdminUsers,
  getSubstitutesList,
  createSubstitute,
  deleteSubstitute,
  updateUserRole,
  getLocalProducts,
  deleteProduct,
} from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function AdminDashboard() {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [substitutes, setSubstitutes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form for new substitute
  const [newSub, setNewSub] = useState({
    originalCode: '',
    reason: '',
    substituteCode: '',
    substituteName: '',
    substituteGrade: 'B',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, subsRes, productsRes] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getSubstitutesList(),
        getLocalProducts(),
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setSubstitutes(subsRes.data.substitutes);
      setProducts(productsRes.data.products);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubstitute = async (e) => {
    e.preventDefault();
    try {
      await createSubstitute({
        originalCode: newSub.originalCode,
        reason: newSub.reason,
        substituteProduct: {
          code: newSub.substituteCode,
          product_name: newSub.substituteName,
          nutriscore_grade: newSub.substituteGrade,
        },
      });
      setNewSub({
        originalCode: '',
        reason: '',
        substituteCode: '',
        substituteName: '',
        substituteGrade: 'B',
      });
      const subsRes = await getSubstitutesList();
      setSubstitutes(subsRes.data.substitutes);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create substitute');
    }
  };

  const handleDeleteSubstitute = async (id) => {
    try {
      await deleteSubstitute(id);
      setSubstitutes((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete substitute');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await updateUserRole(userId, role);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  if (loading) return <LoadingSpinner message="Loading admin dashboard..." />;

  return (
    <div className="container page admin-page">
      <h1>Admin Dashboard</h1>
      <p className="page-subtitle">Manage products, substitutes, and users.</p>

      <ErrorMessage message={error} onRetry={loadData} />

      <div className="admin-tabs">
        {['stats', 'users', 'substitutes', 'products'].map((t) => (
          <button
            key={t}
            type="button"
            className={`admin-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.userCount}</span>
            <span className="stat-label">Users</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.productCount}</span>
            <span className="stat-label">Products</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.substituteCount}</span>
            <span className="stat-label">Substitutes</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.savedCount}</span>
            <span className="stat-label">Saved substitutions</span>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td>{u.allergens?.length || 0} allergens</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'substitutes' && (
        <div>
          <form className="admin-form" onSubmit={handleCreateSubstitute}>
            <h3>Add substitute suggestion</h3>
            <div className="form-row">
              <input
                placeholder="Original product barcode"
                value={newSub.originalCode}
                onChange={(e) => setNewSub({ ...newSub, originalCode: e.target.value })}
                required
              />
              <input
                placeholder="Substitute barcode"
                value={newSub.substituteCode}
                onChange={(e) => setNewSub({ ...newSub, substituteCode: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <input
                placeholder="Substitute product name"
                value={newSub.substituteName}
                onChange={(e) => setNewSub({ ...newSub, substituteName: e.target.value })}
                required
              />
              <select
                value={newSub.substituteGrade}
                onChange={(e) => setNewSub({ ...newSub, substituteGrade: e.target.value })}
              >
                {['A', 'B', 'C', 'D', 'E'].map((g) => (
                  <option key={g} value={g}>
                    Nutri-Score {g}
                  </option>
                ))}
              </select>
            </div>
            <input
              placeholder="Reason for substitution"
              value={newSub.reason}
              onChange={(e) => setNewSub({ ...newSub, reason: e.target.value })}
            />
            <button type="submit" className="btn btn-primary">
              Add substitute
            </button>
          </form>

          <div className="admin-list">
            {substitutes.map((s) => (
              <div key={s._id} className="admin-list-item">
                <div>
                  <strong>{s.originalCode}</strong> →{' '}
                  {s.substituteProduct?.product_name} ({s.substituteProduct?.nutriscore_grade})
                  <br />
                  <small>{s.reason}</small>
                </div>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteSubstitute(s._id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Name</th>
                <th>Nutri-Score</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>{p.code}</td>
                  <td>{p.product_name_fr || p.product_name}</td>
                  <td>{p.nutriscore_grade?.toUpperCase()}</td>
                  <td>{p.source}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteProduct(p._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
