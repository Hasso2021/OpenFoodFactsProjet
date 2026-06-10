import mongoose from 'mongoose';

// Produit stocké localement (ajouté par l'admin, en complément d'Open Food Facts)
const productSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    product_name: { type: String, required: true, trim: true },
    product_name_fr: { type: String, trim: true },
    nutriscore_grade: { type: String, default: 'unknown' },
    image_url: { type: String },
    categories_tags: [String],
    allergens_tags: [String],
    nutriments: mongoose.Schema.Types.Mixed,
    brands: { type: String },
    source: { type: String, default: 'local' },
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
