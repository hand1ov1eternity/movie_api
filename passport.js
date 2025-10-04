/**
 * @fileoverview Configures Passport authentication strategies for local login and JWT authentication.
 * @module passport
 */

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Models = require('./models.js');
const passportJWT = require('passport-jwt');

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

/**
 * Local strategy for user authentication using username and password.
 * @strategy LocalStrategy
 */
passport.use(
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password',
    },
    async (username, password, callback) => {
      // Safe logging (no password)
      console.log(`Auth attempt for username: ${username}`);

      try {
        const user = await Users.findOne({ username: username });
        if (!user) {
          console.log(`Auth failed: no such user (${username})`);
          return callback(null, false, { message: 'Incorrect username or password.' });
        }

        if (!user.validatePassword(password)) {
          console.log(`Auth failed: bad password for (${username})`);
          return callback(null, false, { message: 'Incorrect username or password.' });
        }

        console.log(`Auth success for ${username}`);
        return callback(null, user);
      } catch (error) {
        console.error('LocalStrategy error:', error);
        return callback(error);
      }
    }
  )
);

/**
 * JWT strategy for authenticating users using a JWT token.
 * @strategy JwtStrategy
 */
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET, // <= use env, not hardcoded
    },
    async (jwtPayload, callback) => {
      try {
        // match what we sign below (_id)
        const user = await Users.findById(jwtPayload._id);
        return callback(null, user || false);
      } catch (error) {
        return callback(error);
      }
    }
  )
);
