/** controllers/AppControllers
 * Inside the folder controllers,
 *  create a file AppController.js that contains the definition of the 2 endpoints:
 * GET /status should return if Redis is alive
 *  and if the DB is alive too
 *  by using the 2 utils created previously:
 *  { "redis": true, "db": true } with a status code 200
 * GET /stats should return the number of users and files in DB:
 *  { "users": 12, "files": 1231 } with a status code 200
 * users collection must be used for counting all users
 * files collection must be used for counting all files
 */
import redisClient from '../utils/redis';

import DBClient from '../utils/db';

const AppController = {
  getStatus: (request, response) => {
    const redisAlive = redisClient.isAlive();
    const dbAlive = DBClient.isAlive();

    if (redisAlive && dbAlive) {
      response.status(200).json({ redis: true, db: true });
    } else {
      response.status(500).json({ error: 'Service Not Available' });
    }
  },

  getStats: (request, response) => {
    const userCount = DBClient.nbUsers();
    const fileCount = DBClient.nbFiles();

    response.status(200).json({ users: userCount, files: fileCount });
  },
};

module.exports = AppController;
