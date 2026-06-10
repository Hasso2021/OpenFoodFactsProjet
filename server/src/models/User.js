import mongoose from 'mongoose';

// Schéma utilisateur : compte, rôle, allergènes, consentement RGPD
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // Ne jamais renvoyer le mot de passe par défaut
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // Tags allergènes Open Food Facts (ex: "en:gluten")
    allergens: {
      type: [String],
      default: [],
    },
    gdprConsent: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
