/**
 * @fileoverview Handles user authentication and JWT token generation.
 * @module auth
 */

const jwt = require('jsonwebtoken');
const passport = require('passport');
require('./passport'); // Ensure passport strategies are configured

/**
 * Secret key for signing JWT tokens.
 * @constant {string}
 */
const jwtSecret = process.env.JWT_SECRET; // <= environment variable for security

/**
 * Generates a JWT token for a user.
 * @function
 * @param {Object} user - The user object to encode in the JWT
 * @returns {string} - Signed JWT token
 */
const generateJWTToken = (user) => {
  return jwt.sign(
    { _id: user._id, username: user.username }, // <= include _id
    jwtSecret,
    { subject: user.username, expiresIn: '7d', algorithm: 'HS256' }
  );
};

/**
 * Defines the login route for user authentication.
 * @route POST /login
 * @group Authentication - User login and token generation
 * @param {Object} req - Express request object
 * @param {Object} req.body - Contains username and password for login
 * @param {Object} res - Express response object
 * @returns {Object} 200 - User object and JWT token
 * @returns {Error} 400 - Invalid credentials or authentication failure
 */
module.exports = (router) => {
  router.post('/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user) => {
      if (error || !user) return res.status(400).json({ message: 'Invalid credentials' });
      req.login(user, { session: false }, (err) => {
        if (err) return res.status(500).send(err);
        const token = generateJWTToken(user.toJSON());
        return res.json({
          user: {
            username: user.username,
            email: user.email,
            birthday: user.birthday,
            favoriteMovies: user.favoriteMovies,
          },
          token,
        });
      });
    })(req, res);
  });
};
