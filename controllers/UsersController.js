const crypto = require('crypto');
const dbClient = require('../utils/db');

async function postNew(req, res) {
  const { email, password } = req.body;

  // Validates input
  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Missing password' });
  }

  // Checks for existing user
  const existingUser = await dbClient.db.collection('users').findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: 'Already exist' });
  }

  // Hashes password and saves user
  const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
  const newUser = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });

  // Returns new user info
  res.status(201).json({ id: newUser.insertedId, email });
  return undefined;
}

module.exports = { postNew };
