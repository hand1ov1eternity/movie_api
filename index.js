const express = require('express');
const morgan = require('morgan');
const path = require('path');
const bodyParser = require('express').json; // Middleware to parse JSON requests
const app = express();
const mongoose = require('mongoose');
const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/cfDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middleware to log all requests and parse JSON
app.use(morgan('common'));
app.use(bodyParser());

// Require Authentication Logic 
let auth = require('./auth')(app);

// Require Passport module
const passport = require('passport');
require('./passport');

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// GET route for the homepage
app.get('/', (req, res) => {
  res.send('Welcome to My Movie API!');
});

// GET all movies
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const movies = await Movies.find();
    res.status(200).json(movies);
  } catch (err) {
    res.status(500).json({ error: 'Unable to fetch movies' });
  }
});

// GET a single movie by title
app.get('/movies/:title', async (req, res) => {
  try {
    const movie = await Movies.findOne({ title: req.params.title });
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.status(200).json(movie);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching movie' });
  }
});

// GET a genre by name
app.get('/genres/:name', async (req, res) => {
  try {
    const movie = await Movies.findOne({ 'genre.name': req.params.name });
    if (!movie) return res.status(404).json({ error: 'Genre not found' });
    res.status(200).json(movie.genre);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching genre' });
  }
});

// GET a director by name
app.get('/directors/:name', async (req, res) => {
  try {
    const movie = await Movies.findOne({ 'director.name': req.params.name });
    if (!movie) return res.status(404).json({ error: 'Director not found' });
    res.status(200).json(movie.director);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching director' });
  }
});

// POST user registration
app.post('/users/register', (req, res) => {
  const { email, password, username } = req.body;
  
  // Check if all required fields are provided
  if (!email || !password || !username) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newUser = new Users({
    email,
    password,
    username
  });

  newUser.save()
    .then(user => {
      res.status(201).json({ message: "User registration successful" });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: "Unable to register user", details: err.message });
    });
});

// PUT update user info
app.put('/users/:email', async (req, res) => {
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { email: req.params.email },
      { username: req.body.username },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ message: 'User info updated successfully', user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: 'Error updating user info' });
  }
});

// POST add movie to favorites
app.post('/users/favorites/:movieTitle', async (req, res) => {
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { email: req.body.email },
      { $addToSet: { favorites: req.params.movieTitle } },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ message: 'Movie added to favorites', user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: 'Error adding movie to favorites' });
  }
});

// DELETE remove movie from favorites
app.delete('/users/favorites/:movieTitle', async (req, res) => {
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { email: req.body.email },
      { $pull: { favorites: req.params.movieTitle } },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ message: 'Movie removed from favorites', user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: 'Error removing movie from favorites' });
  }
});

// DELETE deregister a user
app.delete('/users/deregister/:email', async (req, res) => {
  try {
    const deletedUser = await Users.findOneAndDelete({ email: req.params.email });
    if (!deletedUser) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ message: 'User deregistered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error deregistering user' });
  }
});

// Error handling middleware for logging errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

