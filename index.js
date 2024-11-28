const express = require('express');
const morgan = require('morgan');
const path = require('path');
const bodyParser = require('express').json; // Middleware to parse JSON requests
const app = express();
const mongoose = require('mongoose');
const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User;
const cors = require('cors');

// Run CORS
let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];

app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message ), false);
    }
    return callback(null, true);
  }
}));

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
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.find()
    .then((movies) => res.status(200).json(movies))
    .catch((err) => res.status(500).send('Error: ' + err));
});

// Return data about a single movie by title
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.findOne({ title: req.params.title })
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
app.get('/genres/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.findOne({ 'genre.name': req.params.name })
    .then((movie) => {
      if (!movie) {
        res.status(404).send('Genre not found');
      } else {
        res.json(movie.genre);
      }
    })
    .catch((err) => res.status(500).send('Error: ' + err));
});

// Return data about a director by name
app.get('/directors/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.findOne({ 'director.name': req.params.name })
    .then((movie) => {
      if (!movie) {
        res.status(404).send('Director not found');
      } else {
        res.json(movie.director);
      }
    })
    .catch((err) => res.status(500).send('Error: ' + err));
});


// Return data about a user
app.get('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.findOne({ username: req.params.username })
    .then((user) => {
      if (!user) {
        return res.status(404).send('User not found');
      }
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Register new user
app.post('/users', async (req, res) => {
  let hashedPassword = Users.hashPassword(req.body.password);
  await Users.findOne({ username: req.body.username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.username + ' already exists');
      } else {
        Users
          .create({
            username: req.body.username,
            password: hashedPassword,
            email: req.body.email,
            birthday: req.body.birthday
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
app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
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
app.put('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  // CONDITION TO CHECK 
  if(req.user.username !== req.params.username){
    return res.status(400).send('Permission denied');
}
  await Users.findOneAndUpdate({ username: req.params.username }, { $set:
    {
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
      birthday: req.body.birthday
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
app.delete('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.findOneAndDelete({ username: req.params.username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.username + ' was not found');
      } else {
        res.status(200).send(req.params.username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Add a movie to a user`s favorites
app.post('/users/:username/movies/:movieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.findOneAndUpdate(
    { username: req.params.username },
    { $push: { favoriteMovies: req.params.movieID } },
    { new: true }
  )
    .then((updatedUser) => res.json(updatedUser))
    .catch((err) => res.status(500).send('Error: ' + err));
});

// Remove a movie from a user`s favorites
app.delete('/users/:username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.findOneAndUpdate(
    { username: req.params.username },
    { $pull: { favoriteMovies: req.params.MovieID } },
    { new: true }
  )
    .then(() => res.json({ message: `Movie ${req.params.MovieID} was removed from ${req.params.username}'s favorites.` }))
    .catch((err) => res.status(500).send('Error: ' + err));
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

