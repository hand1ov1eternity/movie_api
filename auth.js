/**
 * @fileoverview Handles user authentication and JWT token generation.
 * @module auth
 */

const jwt = require('jsonwebtoken');
const passport = require('passport');

require('./passport'); // Import local Passport configuration

/**
 * Secret key for signing JWT tokens.
 * @constant {string}
 */
const jwtSecret = 'your_jwt_secret'; // This must match the key used in JWTStrategy

/**
 * Generates a JWT token for a user.
 * @function
 * @param {Object} user - The user object to encode in the JWT
 * @returns {string} - Signed JWT token
 */
const generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.username, // Encodes the username in the JWT
    expiresIn: '7d', // Token expiration time (7 days)
    algorithm: 'HS256' // Signing algorithm
  });
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
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        return res.status(400).json({
          message: 'Something is not right'
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          return res.send(error);
        }
        let token = generateJWTToken(user.toJSON());
        return res.json({ user, token });
      });
    })(req, res);
  });
};
