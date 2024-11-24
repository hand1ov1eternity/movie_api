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

// Return all movies
app.get('/movies', async (req, res) => {
  await Movies.find()
    .then((movies) => res.status(200).json(movies))
    .catch((err) => res.status(500).send('Error: ' + err));
});

// Return data about a single movie by title
app.get('/movies/:Title', async (req, res) => {
  await Movies.findOne({ Title: req.params.Title })
    .then((movie) => {
      if (!movie) {
        res.status(404).send('Movie not found');
      } else {
        res.json(movie);
      }
    })
    .catch((err) => res.status(500).send('Error: ' + err));
});

// Return data about a genre by name
app.get('/genres/:Name', async (req, res) => {
  await Movies.findOne({ 'Genre.Name': req.params.Name })
    .then((movie) => {
      if (!movie) {
        res.status(404).send('Genre not found');
      } else {
        res.json(movie.Genre);
      }
    })
    .catch((err) => res.status(500).send('Error: ' + err));
});

// Return data about a director by name
app.get('/directors/:Name', async (req, res) => {
  await Movies.findOne({ 'Director.Name': req.params.Name })
    .then((movie) => {
      if (!movie) {
        res.status(404).send('Director not found');
      } else {
        res.json(movie.Director);
      }
    })
    .catch((err) => res.status(500).send('Error: ' + err));
});

// Register new user
app.post('/users', async (req, res) => {
  await Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + 'already exists');
      } else {
        Users
          .create({
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
          .then((user) =>{res.status(201).json(user) })
        .catch((error) => {
          console.error(error);
          res.status(500).send('Error: ' + error);
        })
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

// Get all users
app.get('/users', async (req, res) => {
  await Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Update a user's info,by username
app.put('/users/:Username', async (req, res) => {
  await Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
    {
      Username: req.body.Username,
      Password: req.body.Password,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }
  },
  { new: true }) // This line makes sure that the updated document is returned
  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  })

});

// Delete a user by username
app.delete('/users/:Username', async (req, res) => {
  await Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Add a movie to a user`s favorites
app.post('/users/:Username/movies/:MovieID', async (req, res) => {
  await Users.findOneAndUpdate(
    { Username: req.params.Username },
    { $push: { FavoriteMovies: req.params.MovieID } },
    { new: true }
  )
    .then((updatedUser) => res.json(updatedUser))
    .catch((err) => res.status(500).send('Error: ' + err));
});

// Remove a movie from a user`s favorites
app.delete('/users/:Username/movies/:MovieID', async (req, res) => {
  await Users.findOneAndUpdate(
    { Username: req.params.Username },
    { $pull: { FavoriteMovies: req.params.MovieID } },
    { new: true }
  )
    .then((updatedUser) => res.json(updatedUser))
    .catch((err) => res.status(500).send('Error: ' + err));
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

