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
    res.sendFile(path.join(__dirname, 'index.html'));
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

