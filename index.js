/**
 * @file index.js
 * @description Main Express server setup and API endpoints for the movie application.
 */
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const { check, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

const app = express();

// ---- Environment flags
const isProd = process.env.NODE_ENV === 'production';
const hasDebugToken = Boolean(process.env.DEBUG_TOKEN);

// Tunables
const devLimitPerMin   = 100; // very relaxed for local testing
const prodLimitPerMin  = 60;  // stricter for real users
const prodDelayAfter   = 40;  // start delaying after 40 req/min
const prodDelayMs      = 100; // add 100ms per extra request

// Slowdown (gentle per-request delay after a threshold)
const searchSlowdown = slowDown({
  windowMs: 60 * 1000,
  delayAfter: isProd ? prodDelayAfter : devLimitPerMin * 2, // effectively off in dev
  delayMs: isProd ? prodDelayMs : 0,
  maxDelayMs: 1000,
});

// If you’re behind a proxy (e.g., Render/Heroku)
app.set('trust proxy', 1);

// ---- Middleware: logger + JSON body parsing + CORS
app.use(morgan('common'));
app.use(express.json());

/**
 * CORS allowlist
 */
const allowedOrigins = [
  'http://localhost:8080',       // dev server
  'http://localhost:1234',       // parcel/alt dev server
  'http://testsite.com',         // test domain
  'https://myflixappclient.netlify.app', // <-- replace with your prod client origin
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow tools like curl/Postman (no Origin header)
    if (!origin) return callback(null, true);
    return allowedOrigins.includes(origin)
      ? callback(null, true)
      : callback(new Error('CORS blocked: ' + origin), false);
  },
  credentials: true,
}));

// ---- DB connect
mongoose.connect(process.env.CONNECTION_URI, {});
console.log('Mongo URI:', process.env.CONNECTION_URI);

// ---- Models
const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User;

// ---- Passport strategies
const passport = require('passport');
require('./passport');

// ---- Auth routes (mounts POST /login)
require('./auth')(app);

// ---- Static files (optional)
app.use(express.static(path.join(__dirname, 'public')));

// Hard limit (deny with 429 after the limit)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: isProd ? prodLimitPerMin : devLimitPerMin,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many search requests. Please try again shortly.' },
});

// Apply limiter BEFORE the /search route handler
app.use('/search', searchSlowdown, searchLimiter);

/**
 * GET: Welcome
 */
app.get('/', (req, res) => {
  res.send('Welcome to My Movie API!');
});

/**
 * GET: All users (protected)
 */
app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const users = await Users.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).send('Error fetching users: ' + err);
  }
});

/**
 * GET: User by username (protected)
 */
app.get('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const user = await Users.findOne({ username: req.params.username }).populate('favoriteMovies');
    if (!user) return res.status(404).send('User not found');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).send('Error: ' + err);
  }
});

/**
 * GET: All movies (public)
 */
app.get('/movies', async (req, res) => {
  try {
    const movies = await Movies.find();
    res.status(200).json(movies);
  } catch (err) {
    res.status(500).send('Error fetching movies');
  }
});

/**
 * GET: Movie by title (protected)
 */
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const movie = await Movies.findOne({ title: req.params.title });
    if (!movie) return res.status(404).send('Movie not found');
    res.json(movie);
  } catch (err) {
    res.status(500).send('Error: ' + err);
  }
});

/**
 * GET: Semantic search with optional fallback
 * Params: q (required, min 3), limit (<=50), threshold (0..1), includeScores (bool)
 * Response: { results, total, usedFallback, tookMs }
 */
app.get('/search', async (req, res) => {
  const started = Date.now();
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 3) {
      return res.status(400).json({ error: 'Query must be at least 3 characters' });
    }

    const MAX_LIMIT = 50;
    const limit = Math.min(parseInt(req.query.limit || '20', 10), MAX_LIMIT);
    const threshold = Math.max(0, Math.min(parseFloat(req.query.threshold ?? '0.2'), 1));
    const includeScores = String(req.query.includeScores).toLowerCase() === 'true';

    const { embedText } = await import('./utils/embed.mjs');
    const qVec = await embedText(q);

    // only docs with embeddings
    const candidates = await Movies.find(
      { embedding: { $exists: true, $type: 'array', $ne: [] } },
      { title: 1, description: 1, genre: 1, director: 1, imageURL: 1, embedding: 1 }
    ).lean();

    // cosine (safe if not normalized)
    const cosine = (a, b) => {
      let dot = 0, na = 0, nb = 0;
      const n = Math.min(a.length, b.length);
      for (let i = 0; i < n; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
      return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
    };

    let scored = candidates
      .map(m => ({ ...m, score: cosine(qVec, m.embedding) }))
      .filter(m => m.score >= threshold)
      .sort((a, b) => b.score - a.score);

    let usedFallback = false;

    if (scored.length === 0) {
      // fallback: regex on title/description
      usedFallback = true;
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const fallback = await Movies.find(
        { $or: [{ title: new RegExp(safe, 'i') }, { description: new RegExp(safe, 'i') }] },
        { title: 1, description: 1, genre: 1, director: 1, imageURL: 1 }
      ).limit(limit).lean();

      const tookMs = Date.now() - started;
      return res.json({
        results: fallback.map(f => ({
          _id: f._id,
          title: f.title,
          description: f.description,
          genres: f?.genre?.name ? [f.genre.name] : [],
          director: f?.director?.name || null,
          posterUrl: f.imageURL || null,
          ...(includeScores ? { score: 0 } : {}),
        })),
        total: fallback.length,
        usedFallback,
        tookMs,
      });
    }

    const limited = scored.slice(0, limit).map(m => ({
      _id: m._id,
      title: m.title,
      description: m.description,
      genres: m?.genre?.name ? [m.genre.name] : [],
      director: m?.director?.name || null,
      posterUrl: m.imageURL || null,
      ...(includeScores ? { score: Number(m.score.toFixed(4)) } : {}),
    }));

    const tookMs = Date.now() - started;
    res.json({ results: limited, total: scored.length, usedFallback, tookMs });
  } catch (e) {
    console.error('Search error:', e);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * POST: Register a new user
 */
app.post('/users', [
  check('username', 'Username must be at least 5 characters long').isLength({ min: 5 }),
  check('password', 'Password is required').not().isEmpty(),
  check('email', 'Invalid email').isEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  try {
    const existing = await Users.findOne({ username: req.body.username });
    if (existing) return res.status(400).send('User already exists');

    const hashedPassword = Users.hashPassword(req.body.password);
    const user = await Users.create({
      username: req.body.username,
      password: hashedPassword,
      email: req.body.email,
      birthday: req.body.birthday,
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).send('Error: ' + error);
  }
});

/**
 * POST: Add a movie to user's favorites (protected)
 */
app.post('/users/:username/movies/:movieId', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { username: req.params.username },
      { $addToSet: { favoriteMovies: req.params.movieId } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).send('User not found');
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).send('Error adding favorite movie: ' + error);
  }
});

/**
 * PUT: Update user profile / favorites (protected)
 */
app.put('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    if (req.user.username !== req.params.username) {
      return res.status(403).send('Permission denied');
    }

    const updatedData = {};
    if (req.body.username) updatedData.username = req.body.username;
    if (req.body.email) updatedData.email = req.body.email;
    if (req.body.birthday) updatedData.birthday = req.body.birthday;

    if (req.body.password) {
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      updatedData.password = hashedPassword;
    }

    // ✅ correct casing per schema
    if (req.body.favoriteMovies) {
      updatedData.favoriteMovies = req.body.favoriteMovies;
    }

    const updatedUser = await Users.findOneAndUpdate(
      { username: req.params.username },
      { $set: updatedData },
      { new: true }
    );

    if (!updatedUser) return res.status(404).send('User not found');
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).send('Error updating user: ' + err);
  }
});

/**
 * DELETE: Remove a user (protected)
 */
app.delete('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const user = await Users.findOneAndDelete({ username: req.params.username });
    if (!user) return res.status(400).send('User not found');
    res.status(200).send(`${req.params.username} was deleted.`);
  } catch (err) {
    res.status(500).send('Error: ' + err);
  }
});

/**
 * DELETE: Remove a favorite movie (protected)
 */
app.delete('/users/:username/movies/:movieId', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    if (req.user.username !== req.params.username) {
      return res.status(403).send('Permission denied');
    }

    const updatedUser = await Users.findOneAndUpdate(
      { username: req.params.username },
      { $pull: { favoriteMovies: req.params.movieId } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).send('User not found');
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).send('Error removing favorite movie: ' + err);
  }
});

// ---- Debug route (dev-only, or token-guarded in prod)
function requireDebugToken(req, res, next) {
  if (!hasDebugToken) return res.status(403).json({ error: 'DEBUG_TOKEN not configured' });
  const header = req.get('x-debug-token');
  if (header !== process.env.DEBUG_TOKEN) return res.status(401).json({ error: 'Invalid debug token' });
  next();
}

if (!isProd || hasDebugToken) {
  app.get(
    '/debug/embeddings',
    hasDebugToken && isProd ? requireDebugToken : (req, res, next) => next(),
    async (req, res) => {
      try {
        const embeddedCount = await Movies.countDocuments({
          embedding: { $exists: true, $type: 'array', $ne: [] }
        });
        const total = await Movies.estimatedDocumentCount();
        res.json({
          embeddedCount,
          total,
          coverage: total ? Number((embeddedCount / total).toFixed(3)) : 0
        });
      } catch (e) {
        console.error('debug/embeddings error:', e);
        res.status(500).json({ error: 'Failed to count embeddings' });
      }
    }
  );
}

// ---- Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});