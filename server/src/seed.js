import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Substitute from './models/Substitute.js';

dotenv.config();

/**
 * Script d'initialisation : crée un admin et des produits d'exemple
 * Lancer avec : npm run seed
 */
async function seed() {
  await connectDB();

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@openfactfood.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const salt = await bcrypt.genSalt(10);
    admin = await User.create({
      name: 'Admin',
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, salt),
      role: 'admin',
      gdprConsent: true,
    });
    console.log(`Admin créé : ${adminEmail} / ${adminPassword}`);
  } else {
    console.log('Admin déjà existant');
  }

  // Supprimer l'ancien produit erroné (7622210449283 = biscuit Prince, pas Nutella)
  await Product.deleteOne({ code: '7622210449283' });
  await Substitute.deleteMany({ originalCode: '7622210449283' });

  const sampleProducts = [
    {
      code: '3017620422003',
      product_name: 'Nutella',
      product_name_fr: 'Nutella',
      nutriscore_grade: 'E',
      image_url:
        'https://images.openfoodfacts.net/images/products/301/762/042/2003/front_fr.842.400.jpg',
      categories_tags: ['en:spreads', 'en:hazelnut-spreads'],
      allergens_tags: ['en:nuts', 'en:milk', 'en:soybeans'],
      source: 'local',
    },
    {
      code: '3229820100234',
      product_name: 'Biscuits fourrés chocolat noir',
      product_name_fr: 'Fourrés Chocolat Noir',
      nutriscore_grade: 'D',
      categories_tags: ['en:biscuits', 'en:sweet-snacks'],
      allergens_tags: ['en:gluten', 'en:milk', 'en:soybeans'],
      source: 'local',
    },
  ];

  for (const p of sampleProducts) {
    await Product.findOneAndUpdate({ code: p.code }, p, { upsert: true });
  }
  console.log('Produits d\'exemple ajoutés');

  const nutella = await Product.findOne({ code: '3017620422003' });
  if (nutella) {
    await Substitute.findOneAndUpdate(
      { originalCode: '3017620422003' },
      {
        originalCode: '3017620422003',
        originalProduct: nutella.toObject(),
        substituteProduct: {
          code: '80841197',
          product_name: 'ZERO',
          product_name_fr: 'Pâte à tartiner cacao noisettes ZERO',
          nutriscore_grade: 'c',
          image_url:
            'https://images.openfoodfacts.net/images/products/000/008/084/1197/front_de.28.400.jpg',
          categories_tags: ['en:cocoa-and-hazelnuts-spreads', 'en:spreads'],
          allergens_tags: ['en:nuts', 'en:milk'],
        },
        reason: 'Moins de sucre et meilleur Nutri-Score (C vs E)',
        createdBy: admin._id,
        isActive: true,
      },
      { upsert: true }
    );
    console.log('Substitution d\'exemple ajoutée');
  }

  console.log('Initialisation terminée !');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
