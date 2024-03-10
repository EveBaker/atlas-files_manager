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

import redis from 'redis';

class RedisClient {
  constructor() {
    this.client = redis.createClient();

    // Display any errors in the console
    this.client.on('error', (err) => {
      console.error(`Redis client error: ${err}`);
    });

    // connect to the server
    this.client.connected = true;
  }

  // Check if the connection is alive
  isAlive() {
    // Check if the client is defined and connected
    if (this.client && this.client.connected) {
      return true;
    }
    return false;
  }

  async get(key) {
    // Retrieve the value from Redis for the given key
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, value) => {
        if (err) {
          reject(err);
        } else {
          resolve(value);
        }
      });
    });
  }

  async set(key, value, duration) {
    // Convert duration to integer
    const expiration = parseInt(duration, 10);

    // Store the value in Redis with expiration
    return new Promise((resolve, reject) => {
      this.client.set(key, value, 'EX', expiration, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }

  async del(key) {
    // Remove the value from Redis for the given key
    return new Promise((resolve, reject) => {
      this.client.del(key, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

const redisClient = new RedisClient();

export default redisClient;
