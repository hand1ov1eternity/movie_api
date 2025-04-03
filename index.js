/**
 * @file index.js
 * @description Main Express server setup and API endpoints for the movie application.
 */

const express = require('express');
const morgan = require('morgan');
const path = require('path');
const bodyParser = require('express').json;
const mongoose = require('mongoose');
const Models = require('./models.js');
const cors = require('cors');
const { check, validationResult } = require('express-validator');

// Run CORS
let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];

app.use(cors())/*{
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message ), false);
    }
    return callback(null, true);
  }
}));*/

// Connect to MongoDB
mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

/*mongoose.connect('mongodb://localhost:27017/cfDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});*/

// Middleware to log all requests and parse JSON
app.use(morgan('common'));
app.use(bodyParser());

// Require Authentication Logic 
let auth = require('./auth')(app);

// Require Passport module
const passport = require('passport');
require('./passport');

const app = express();
const Movies = Models.Movie;
const Users = Models.User;

// Middleware setup
app.use(morgan('common'));
app.use(bodyParser());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
require('./auth')(app);

// Connect to MongoDB
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

/**
 * GET: Returns a welcome message.
 * @name WelcomeMessage
 * @route {GET} /
 */
app.get('/', (req, res) => {
  res.send('Welcome to My Movie API!');
});

// Return all movies
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

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
