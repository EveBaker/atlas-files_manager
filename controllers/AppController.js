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
// Import the necessary dependencies
const redisClient = require('../utils/redis');
const DBClient = require('../utils/db');

// Define the controller object
const AppController = {
  // Endpoint to check the status of Redis and DB
  getStatus: async (req, res) => {
    try {
      // Check if Redis and DB are alive
      const redisAlive = redisClient.isAlive();
      const dbAlive = await DBClient.isAlive();

      // Respond with status and appropriate status code
      res.status(200).json({ redis: redisAlive, db: dbAlive });
    } catch (error) {
      // If there's an error, respond with 500 Internal Server Error
      console.error('Error checking status:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // Endpoint to get the number of users and files
  getStats: async (req, res) => {
    try {
      // Use the user and file counting functions from the DB client
      const userCount = await DBClient.nbUsers();
      const fileCount = await DBClient.nbFiles();

      // Respond with the counts and appropriate status code
      res.status(200).json({ users: userCount, files: fileCount });
    } catch (error) {
      // If there's an error, respond with 500 Internal Server Error
      console.error('Error getting stats:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

// Export the controller object
module.exports = AppController;
