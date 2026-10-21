const redis = require('redis');

// Note: Yahan apna actual Upstash host, port aur password daalna
const redisUrl = `rediss://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

const redisClient = redis.createClient({
    url: redisUrl
});

module.exports = redisClient;