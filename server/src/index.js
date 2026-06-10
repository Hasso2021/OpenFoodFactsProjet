import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import substituteRoutes from './routes/substitutes.js';
import savedSubstitutionRoutes from './routes/savedSubstitutions.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Autoriser les requêtes du frontend React
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// Vérification que l'API fonctionne
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'OpenFactFood API is running' });
});

// Routes de l'API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/substitutes', substituteRoutes);
app.use('/api/saved-substitutions', savedSubstitutionRoutes);
app.use('/api/admin', adminRoutes);

// Route introuvable
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

// Démarrage après connexion à MongoDB
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Serveur OpenFactFood démarré sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Impossible de démarrer le serveur:', err.message);
    process.exit(1);
  });
