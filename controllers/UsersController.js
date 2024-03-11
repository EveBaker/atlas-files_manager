import crypto from 'crypto';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { ObjectId } from 'mongodb';

class UserController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Validates input
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      // Checks for existing user
      const existingUser = await dbClient.db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Hashes password and saves user
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
      const newUser = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });

      // Returns new user info
      return res.status(201).json({ id: newUser.insertedId, email });
    } catch (error) {
      console.error('Error creating new user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Retrieve user id from Redis
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Fetch user details from the database
      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Return user object with email and id only
      return res.json({ email: user.email, id: user._id });
    } catch (error) {
      console.error('Error fetching user details:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = UserController;
