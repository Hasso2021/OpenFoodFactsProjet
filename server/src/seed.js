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

  const sampleProducts = [
    {
      code: '7622210449283',
      product_name: 'Nutella',
      product_name_fr: 'Nutella',
      nutriscore_grade: 'E',
      image_url: 'https://images.openfoodfacts.org/images/products/762/221/044/9283/front_fr.400.jpg',
      categories_tags: ['en:spreads', 'en:sweet-spreads'],
      allergens_tags: ['en:nuts', 'en:milk', 'en:soybeans'],
      nutriments: { 'energy-kcal_100g': 539, fat_100g: 30.9, sugars_100g: 56.3 },
      source: 'local',
    },
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
  ];

  for (const p of sampleProducts) {
    await Product.findOneAndUpdate({ code: p.code }, p, { upsert: true });
  }
  console.log('Produits d\'exemple ajoutés');

  const nutella = await Product.findOne({ code: '7622210449283' });
  if (nutella) {
    await Substitute.findOneAndUpdate(
      { originalCode: '7622210449283' },
      {
        originalCode: '7622210449283',
        originalProduct: nutella.toObject(),
        substituteProduct: {
          code: '4008258038001',
          product_name: 'Dark Chocolate Hazelnut Spread',
          product_name_fr: 'Pâte à tartiner cacao noisettes',
          nutriscore_grade: 'C',
          categories_tags: ['en:spreads'],
          allergens_tags: ['en:nuts'],
        },
        reason: 'Lower sugar content and better Nutri-Score',
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
