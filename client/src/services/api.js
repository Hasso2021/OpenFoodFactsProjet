import axios from 'axios';

// URL de l'API backend (proxy Vite par défaut : /api)
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Ajoute le token JWT à chaque requête si l'utilisateur est connecté
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Authentification ---
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/profile', data);

// --- Produits ---
export const searchProducts = (params) => api.get('/products/search', { params });
export const getProductByBarcode = (code) => api.get(`/products/barcode/${code}`);
export const getSubstitutes = (code) => api.get(`/products/${code}/substitutes`);
export const getAllergensTaxonomy = () => api.get('/products/allergens/taxonomy');
export const getLocalProducts = () => api.get('/products/local');

// --- Substitutions sauvegardées (utilisateur) ---
export const getSavedSubstitutions = () => api.get('/saved-substitutions');
export const saveSubstitution = (data) => api.post('/saved-substitutions', data);
export const deleteSavedSubstitution = (id) => api.delete(`/saved-substitutions/${id}`);

// --- Substitutions admin ---
export const getSubstitutesList = () => api.get('/substitutes');
export const createSubstitute = (data) => api.post('/substitutes', data);
export const updateSubstitute = (id, data) => api.put(`/substitutes/${id}`, data);
export const deleteSubstitute = (id) => api.delete(`/substitutes/${id}`);

// --- Administration ---
export const getAdminUsers = () => api.get('/admin/users');
export const getAdminStats = () => api.get('/admin/stats');
export const createProduct = (data) => api.post('/admin/products', data);
export const updateProduct = (id, data) => api.put(`/admin/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/admin/products/${id}`);
export const updateUserRole = (id, role) => api.put(`/admin/users/${id}/role`, { role });

export default api;
