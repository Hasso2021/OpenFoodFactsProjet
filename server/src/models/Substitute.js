import mongoose from 'mongoose';

// Snapshot d'un produit (copie des données au moment de la sauvegarde)
const productSnapshotSchema = new mongoose.Schema(
  {
    code: String,
    product_name: String,
    product_name_fr: String,
    nutriscore_grade: String,
    image_url: String,
    categories_tags: [String],
    allergens_tags: [String],
    nutriments: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

// Substitution créée par l'admin pour tous les utilisateurs
const substituteSchema = new mongoose.Schema(
  {
    originalCode: {
      type: String,
      required: true,
      trim: true,
    },
    originalProduct: productSnapshotSchema,
    substituteProduct: {
      type: productSnapshotSchema,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      default: 'Healthier alternative suggested by OpenFactFood',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

substituteSchema.index({ originalCode: 1 });

export default mongoose.model('Substitute', substituteSchema);
