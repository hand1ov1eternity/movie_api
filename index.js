const express = require('express');
const morgan = require ('morgan');
const path = require ('path');
const app = express();

//Middleware to log all requests
app.use(morgan('common'));

//Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

//GET route for the homepage
app.get('/', (req, res) => {
  res.send('Welcome to My Movie API!');
});

// Route to return a list of all the movies
app.get('/movies', (req, res) => {
  res.send('GET request returning data on all movies');
});

// Route to return data on a single movie by title
app.get('/movies/:title', (req, res) => {
  res.send(`GET request returning data for the movie with title: ${req.params.title}`);
});

// Route to return data about a genre by name
app.get('/genres/:name', (req, res) => {
  res.send(`GET request returning data for the genre: ${req.params.name}`);
});

// Route to return data about a director by name
app.get('/directors/:name', (req, res) => {
  res.send(`GET request returning data for the director: ${req.params.name}`);
});

// Route for user registration
app.post('/users/register', (req, res) => {
  res.send('POST request to register a new user');
});

// Route to update user info (username)
app.put('/users/:email', (req, res) => {
  res.send(`PUT request to update user info for email: ${req.params.email}`);
});

// Route to add a movie to user favorites
app.post('/users/favorites/:movieTitle', (req, res) => {
  res.send(`POST request to add movie "${req.params.movieTitle}" to user favorites`);
});

// Route to remove a movie from user favorites
app.delete('/users/favorites/:movieTitle', (req, res) => {
  res.send(`DELETE request to remove movie "${req.params.movieTitle}" from user favorites`);
});

// Route to deregister a user
app.delete('/users/deregister/:email', (req, res) => {
  res.send(`DELETE request to deregister user with email: ${req.params.email}`);
});

// GET route for the "/movies" endpoint
app.get('/movies', (req, res) => {
    res.json({
      topMovies: [
        { title: 'The Lord of the Rings: The Fellowship of the Ring', year: 2001 },
        { title: 'The Lord of the Rings: The Two Towers', year: 2002 },
        { title: 'The Lord of the Rings: The Return of the King', year: 2003 },
        { title: 'The Dark Knight', year: 2008 },
        { title: 'The Matrix', year: 1999 },
        { title: 'Fight Club', year: 1999 },
        { title: 'Terminator', year: 1984 },
        { title: 'Terminator 2: Judgment Day ', year: 1991 },
        { title: 'Django Unchained', year: 2012 },
        { title: 'All Quiet on the Western Front', year: 2022 }
      ]
    });
  });

//Error handling middleware for logging errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

//Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

