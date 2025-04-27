/**
 * @file index.js
 * @description Main Express server setup and API endpoints for the movie application.
 */
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const bodyParser = require('express').json;
const mongoose = require('mongoose');
const Models = require('./models.js');
const cors = require('cors');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// Initialize the app
const app = express();

/**
 * Run CORS
 * Allowed origins for the app
 */
let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];

// CORS setup for the app
app.use(cors()); // Fixed CORS issue by moving app.use(cors()) after app initialization

// Connect to MongoDB
mongoose.connect(process.env.CONNECTION_URI, {});
console.log('Mongo URI:', process.env.CONNECTION_URI);

// Middleware to log all requests and parse JSON
app.use(morgan('common'));
app.use(bodyParser());

// Require Authentication Logic 
let auth = require('./auth')(app);

// Require Passport module
const passport = require('passport');
require('./passport');

const Movies = Models.Movie;
const Users = Models.User;

// Middleware setup
app.use(express.static(path.join(__dirname, 'public')));

// Require authentication logic for the app
require('./auth')(app);

/**
 * GET: Returns a welcome message.
 * @name WelcomeMessage
 * @route {GET} /
 */
app.get('/', (req, res) => {
  res.send('Welcome to My Movie API!');
});

/**
 * GET: Returns a list of all users.
 * @name GetUsers
 * @route {GET} /users
 * @authentication JWT
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
 * GET: Returns data on a single user by username.
 * @name GetUser
 * @route {GET} /users/:username
 * @authentication JWT
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
 * GET: Returns all movies.
 * @name GetMovies
 * @route {GET} /movies
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
 * GET: Returns a movie by title.
 * @name GetMovie
 * @route {GET} /movies/:title
 * @authentication JWT
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

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Check if username and password are provided
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Find the user by username
    const user = await Users.findOne({ username: username });
    if (!user) {
      return res.status(404).json({ message: 'No such user' });
    }

    // Validate password
    const isPasswordValid = user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Generate a JWT token
    const token = jwt.sign({ username: user.username, id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h', // Token expires in 1 hour
    });

    // Return user data along with token
    res.status(200).json({
      user: {
        username: user.username,
        email: user.email,
        birthday: user.birthday,
        favoriteMovies: user.favoriteMovies,
      },
      token: token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in user', error: error });
  }
});

/**
 * POST: Register a new user.
 * @name RegisterUser
 * @route {POST} /users
 * @body {string} username - The username.
 * @body {string} password - The password.
 * @body {string} email - The email.
 * @body {Date} birthday - The birthday.
 */
app.post('/users', [
  check('username', 'Username must be at least 5 characters long').isLength({ min: 5 }),
  check('password', 'Password is required').not().isEmpty(),
  check('email', 'Invalid email').isEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  let hashedPassword = Users.hashPassword(req.body.password);
  try {
    let user = await Users.findOne({ username: req.body.username });
    if (user) return res.status(400).send('User already exists');

    user = await Users.create({
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
 * POST: Add a movie to a user's list of favorite movies.
 * @name AddFavoriteMovie
 * @route {POST} /users/:username/movies/:movieId
 * @authentication JWT
 */
app.post('/users/:username/movies/:movieId', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { username: req.params.username },
      { $addToSet: { favoriteMovies: req.params.movieId } }, // $addToSet prevents duplicates
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send('User not found');
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).send('Error adding favorite movie: ' + error);
  }
});


/**
 * PUT: Update a user's profile and/or favorite movies.
 * @name UpdateUser
 * @route {PUT} /users/:username
 * @authentication JWT
 */
app.put('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    if (req.user.username !== req.params.username) {
      return res.status(403).send('Permission denied');
    }

    const updatedData = {};

    // Handle optional profile updates
    if (req.body.username) updatedData.username = req.body.username;
    if (req.body.email) updatedData.email = req.body.email;
    if (req.body.birthday) updatedData.birthday = req.body.birthday;

    if (req.body.password) {
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      updatedData.password = hashedPassword;
    }

    // Handle favorites update if present
    if (req.body.FavoriteMovies) {
      updatedData.FavoriteMovies = req.body.FavoriteMovies;
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
 * DELETE: Remove a user by username.
 * @name DeleteUser
 * @route {DELETE} /users/:username
 * @authentication JWT
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
 * DELETE: Removes a movie from a user's list of favorite movies.
 * @name RemoveFavoriteMovie
 * @route {DELETE} /users/:username/movies/:movieId
 * @authentication JWT
 */
app.delete('/users/:username/movies/:movieId', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    if (req.user.username !== req.params.username) {
      return res.status(403).send('Permission denied');
    }

    const updatedUser = await Users.findOneAndUpdate(
      { username: req.params.username },
      { $pull: { favoriteMovies: req.params.movieId } }, // Remove the movie ID from the array
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send('User not found');
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).send('Error removing favorite movie: ' + err);
  }
});


//Start Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


