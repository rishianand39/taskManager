const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  // Get the token from the request headers, query string, or cookies
  let token = req.headers.authorization || req.query.token || req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  token = token.split(" ")[1]
 

  // Verify and decode the token
  jwt.verify(token, process.env.JSON_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Token is valid, so attach the decoded payload to the request object
    req.user = decoded;
    next();
  });
}

module.exports = authenticateToken;
