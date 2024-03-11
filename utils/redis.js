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
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();

    // Display any errors in the console
    this.client.on('error', (err) => {
      console.error(`Redis client error: ${err}`);
    });

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  // Check if the connection is alive
  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    // Retrieve the value from Redis for the given key
    return this.getAsync(key);
  }

  async set(key, value, duration) {
    // 'EX' and duration are passed as part of the same call to setAsync
    return this.setAsync(key, value, 'EX', duration);
  }

  async del(key) {
    // Remove the value from Redis for the given key
    return this.delAsync(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
