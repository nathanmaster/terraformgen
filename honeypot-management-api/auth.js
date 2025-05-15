const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { Pool } = require('pg'); // Or your database client

// PostgreSQL connection pool
const pool = new Pool({
  host: 'localhost', // Replace with your PostgreSQL host (e.g., 'localhost')
  port: 5432,
  database: 'honeypots', // Replace with your database name
  user: 'azureuser', // Replace with your database username
  password: '!Thisismypassword!', // Replace with your database password
});

// Local Strategy for username/password authentication
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      // Query the database for the user
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      const user = result.rows[0];

      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }

      // In a real application, you'd compare hashed passwords using bcrypt
      if (user.password !== password) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = result.rows[0];
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
