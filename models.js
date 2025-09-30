/**
 * @fileoverview Defines the Mongoose schemas and models for movies and users.
 * @module models
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * Mongoose schema for movies.
 * @typedef {Object} Movie
 * @property {string} title - The title of the movie.
 * @property {string} description - A brief description of the movie.
 * @property {Object} genre - The genre of the movie.
 * @property {string} genre.name - The name of the genre.
 * @property {string} genre.description - A brief description of the genre.
 * @property {Object} director - The director of the movie.
 * @property {string} director.name - The name of the director.
 * @property {string} director.bio - A short biography of the director.
 */
let movieSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  genre: {
    name: String,
    description: String,
  },
  director: {
    name: String,
    bio: String,
  },
  embedding: { type: [Number], default: [] },
});

/**
 * Mongoose schema for users.
 * @typedef {Object} User
 * @property {string} username - The user's username.
 * @property {string} password - The user's hashed password.
 * @property {string} email - The user's email address.
 * @property {Date} [birthday] - The user's date of birth (optional).
 * @property {Array.<mongoose.Schema.Types.ObjectId>} favoriteMovies - Array of favorite movies (references Movie model).
 */
let userSchema = mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  birthday: Date,
  favoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
});

/**
 * Hashes a password using bcrypt.
 * @function
 * @param {string} password - The plain-text password to hash.
 * @returns {string} - The hashed password.
 */
userSchema.statics.hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

/**
 * Validates a given password against the stored hashed password.
 * @method
 * @param {string} password - The plain-text password to validate.
 * @returns {boolean} - Returns true if passwords match, false otherwise.
 */
userSchema.methods.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

/**
 * Mongoose model for movies.
 * @type {mongoose.Model<Movie>}
 */
let Movie = mongoose.model('Movie', movieSchema);

/**
 * Mongoose model for users.
 * @type {mongoose.Model<User>}
 */
let User = mongoose.model('User', userSchema);

module.exports.Movie = Movie;
module.exports.User = User;
