# OpenFactFood

Application web responsive pour rechercher des produits alimentaires, consulter leurs informations nutritionnelles et trouver des substituts plus sains grâce à l'API [Open Food Facts](https://world.openfoodfacts.org).



## Stack technique

Frontend -> React 18 + Vite 
Backend -> Node.js + Express
Base de données -> MongoDB + Mongoose
Authentification -> JWT + bcrypt
Requête HTTP -> Axios 
Graphique -> Chart.js

|


## Prérequis

- [Node.js](https://nodejs.org/) v18 ou supérieur
- Un compte [MongoDB Atlas](https://www.mongodb.com/atlas) (gratuit — pas besoin d'installer MongoDB en local)
- npm (inclus avec Node.js)

## Installation

### 1. Cloner et installer les dépendances

```bash
cd server
npm install

cd ../client
npm install
```



```
mongodb+srv://monuser:monmotdepasse@cluster0.xxxxx.mongodb.net/openfactfood?retryWrites=true&w=majority
```

### 3. Configurer les variables d'environnement

**Serveur** — copier le fichier exemple :

```bash
cd server
cp .env.example .env
```

Éditer `server/.env` :

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/openfactfood?retryWrites=true&w=majority

JWT_SECRET=votre_cle_secrete_longue_et_aleatoire
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

> **Alternative locale** : si MongoDB est installé sur votre machine, utilisez  
> `MONGODB_URI=mongodb://127.0.0.1:27017/openfactfood`

**Client** (optionnel — le proxy Vite fonctionne par défaut) :

```bash
cd client
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Initialiser la base de données (optionnel)

Crée un compte admin et des produits d'exemple :

```bash
cd server
npm run seed
```

Identifiants admin par défaut :
- Email : `admin@openfactfood.com`
- Mot de passe : `admin123`

## Lancer l'application

Ouvrir **deux terminaux** :

**Terminal 1 — Backend :**
```bash
cd server
npm run dev
```
Serveur : http://localhost:5000

**Terminal 2 — Frontend :**
```bash
cd client
npm run dev
```
Application : http://localhost:5173

## Collections MongoDB


Collection              Rôle
`users`                Comptes utilisateurs 
`savedsubstitutions`   Substitutions sauvegardées par l'utilisateur
`substitutes`          Substitutions créées par l'admin 
`products`             Produits ajoutés localement par l'admin 

Les produits Open Food Facts ne sont pas stockés en base : ils sont récupérés via l'API à chaque recherche.

## Endpoints API

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| POST | `/api/auth/register` | Public | Créer un compte |
| POST | `/api/auth/login` | Public | Connexion |
| GET | `/api/auth/me` | Auth | Profil utilisateur |
| PUT | `/api/auth/profile` | Auth | Modifier profil et allergènes |
| GET | `/api/products/search` | Public | Rechercher des produits |
| GET | `/api/products/barcode/:code` | Public | Détail par code-barres |
| GET | `/api/products/:code/substitutes` | Public | Substituts plus sains |
| GET | `/api/saved-substitutions` | Auth | Mes substitutions |
| POST | `/api/saved-substitutions` | Auth | Sauvegarder une substitution |
| DELETE | `/api/saved-substitutions/:id` | Auth | Supprimer une sauvegarde |
| GET | `/api/admin/stats` | Admin | Statistiques du dashboard |

## Fonctionnalités

### Utilisateurs publics
- Rechercher des produits (nom, catégorie, code-barres)
- Voir les détails avec Nutri-Score et graphique nutritionnel
- Obtenir des suggestions de substituts plus sains

### Utilisateurs connectés
- Inscription / connexion (JWT)
- Configurer ses allergènes dans le profil
- Sauvegarder des substitutions dans « My Substitutions »
- Consentement RGPD obligatoire à l'inscription

### Administrateur
- Dashboard protégé
- Gestion des utilisateurs et statistiques
- Ajout de produits locaux et substitutions manuelles

## Sécurité

- Mots de passe hashés avec bcrypt
- Tokens JWT pour les routes protégées
- Contrôle d'accès par rôle (admin)
- CORS limité à `CLIENT_URL`
- Les mots de passe ne sont jamais renvoyés par l'API

## API Open Food Facts

L'application utilise :
- Recherche texte : `https://world.openfoodfacts.net/cgi/search.pl`
- Produit par code-barres : `https://world.openfoodfacts.net/api/v2/product/{barcode}`
- Taxonomie allergènes : `https://world.openfoodfacts.org/data/taxonomies/allergens.json`

## Build production

```bash
cd client
npm run build

cd ../server
NODE_ENV=production npm start
```

## Licence

Projet éducatif — Les données Open Food Facts sont disponibles sous la [Open Database License](https://opendatacommons.org/licenses/odbl/1.0/).
