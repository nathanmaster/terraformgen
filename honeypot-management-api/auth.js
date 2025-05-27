require('dotenv').config();
const expressJwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

// Auth0 configuration
const authConfig = {
  domain: process.env.AUTH0_DOMAIN || 'YOUR_AUTH0_DOMAIN', // should be just the domain, no protocol
  audience: process.env.AUTH0_AUDIENCE || 'YOUR_AUTH0_API_AUDIENCE',
};

// JWT validation middleware
const checkJwt = expressJwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`,
  }),
  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ['RS256'],
});

module.exports = { checkJwt };
