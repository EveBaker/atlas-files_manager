/**
    redis.js that contains the class RedisClient.

    RedisClient should have:
    the constructor that creates a client to Redis:
    any error of the redis client must be displayed in the console
    (you should use on('error') of the redis client)
    a function isAlive that returns true when the connection
    to Redis is a success otherwise, false
    an asynchronous function get that takes a string key as argument
    and returns the Redis value stored for this key
    an asynchronous function set that takes a string key,
    a value and a duration in second as arguments to store it in Redis
    (with an expiration set by the duration argument)
    an asynchronous function del that takes a string key as argument
    and remove the value in Redis for this key
    After the class definition, create and export an instance
    of RedisClient called redisClient.
*/
const redis = require('redis');

class RedisClient {
  constructor() {
    // Create a Redis client
    this.client = redis.createClient();

    // Error handling
    this.client.on('error', (err) => console.error('Connection to Redis server failed. Make sure the Redis server is running.', err));

    // Connect to Redis
    this.client.on('connect', () => console.log('Connected to Redis Server'));
  }

  // return when connection to Redis is a success
  isAlive() {
    return this.client.connected;
  }

  // returns the Redis value stored for this key
  async get(key) {
    try {
      const value = await this.client.get(key);
      return value;
    } catch (error) {
      console.error('Error getting value from Redis:', error);
      return null;
    }
  }

  // Set a key-value pair with an expiration
  async set(key, value, duration) {
    try {
      await this.client.set(key, value, 'EX', duration);
    } catch (error) {
      console.error('Error setting value in Redis:', error);
    }
  }

  // Delete a key
  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Error deleting value from Redis:', error);
    }
  }
}

// Export an instance
const redisClient = new RedisClient();
module.exports = redisClient;
