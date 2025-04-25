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
    const user = await Users.findOne({ username: req.params.username });
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

//Start Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


