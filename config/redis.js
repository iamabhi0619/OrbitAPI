const { Redis } = require('ioredis');

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    username: process.env.REDIS_USERNAME || undefined, // only if using ACL
    password: process.env.REDIS_PASSWORD || undefined, // optional
    db: 0,
    lazyConnect: false, // connects immediately
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy: (times) => {
        return Math.min(times * 50, 2000); // reconnect delay
    },
});

module.exports = redis;
