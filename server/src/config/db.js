import mongoose from 'mongoose';

/**
 * Connexion à MongoDB via la variable MONGODB_URI du fichier .env
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('MongoDB connecté avec succès');
  } catch (error) {
    if (
      error.message.includes('whitelist') ||
      error.message.includes('Could not connect to any servers')
    ) {
      throw new Error(
        'Connexion MongoDB Atlas refusée. Dans Atlas : Network Access → Add IP Address → ' +
          'choisir "Add Current IP Address" (ou "Allow Access from Anywhere" en dev local).'
      );
    }
    throw error;
  }
}
