import mongoose from 'mongoose';

// Snapshot d'un produit (copie figée pour l'historique utilisateur)
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

// Substitution sauvegardée par un utilisateur dans "My Substitutions"
const savedSubstitutionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalProduct: {
      type: productSnapshotSchema,
      required: true,
    },
    substituteProduct: {
      type: productSnapshotSchema,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

savedSubstitutionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('SavedSubstitution', savedSubstitutionSchema);
