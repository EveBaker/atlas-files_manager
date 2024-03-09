import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const base64Credentials = authorization.split(' ')[1];
    if (!base64Credentials) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hashedPassword = sha1(password);

    try {
      const user = await dbClient.users.findOne({ email, password: hashedPassword });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = uuidv4();
      const key = `auth_${token}`;
      const expiration = 24 * 3600;

      await redisClient.setex(key, expiration, user._id.toString());

      return res.status(200).json({ token });
    } catch (error) {
      console.error('Error authenticating user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const deletedCount = await redisClient.del(`auth_${token}`);
      if (deletedCount === 0) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      return res.status(204).end();
    } catch (error) {
      console.error('Error disconnecting user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default AuthController;
