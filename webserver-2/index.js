const { RedisPubSub } = require("graphql-redis-subscriptions");
const Redis = require("ioredis");

const options = {
  host: process.env.REDIS_HOST || "surus-poc-dev.redis.cache.windows.net",
  port: process.env.REDIS_PORT ? process.env.REDIS_PORT : "6380",
  password: "BklZnl7ETziXJuSWYTA8FLsM2uWN7FlFPAzCaKBtsuw=",
  retryStrategy: (times) => {
    // reconnect after
    return Math.min(times * 50, 2000);
  },
  tls: {
    rejectUnauthorized: false,
  },
};
const NEW_USER = "new_user";

const pubsub = new RedisPubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options),
});

setTimeout(() => {
  console.log("event published");
  pubsub.publish(NEW_USER, {
    userRegistered: {
      id: 1,
      name: "wally",
    },
  });
}, 5000);
